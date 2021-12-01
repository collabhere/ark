import { ListDatabasesResult, MongoClient, MongoClientOptions } from "mongodb";
import type { SrvRecord } from "dns";
import { promises as netPromises } from "dns";
import { nanoid } from "nanoid";
import { URL } from "url";
import mongoUri from "mongodb-uri";
import { stringify } from "querystring";
import tunnel, { Config } from "tunnel-ssh";

import { ARK_FOLDER_PATH } from "../../utils/constants";
import { ERRORS } from "../../../util/constants";
import { MemEntry } from "../../modules/ipc";
import { Server } from "net";

interface ReplicaSetMember {
	name: string;
	health: number;
	state: number;
	stateStr: "PRIMARY" | "SECONDARY";
}
interface GetConnectionResult {
	replicaSetDetails?: {
		members: ReplicaSetMember[];
		set: string;
	};
}

interface URIConfiguration {
	uri: string;
	name: string;
}

export interface Connection {
	info(
		dep: Ark.DriverDependency,
		arg: { id: string }
	): Promise<GetConnectionResult>;
	/**
	 * Load all stored connections from disk.
	 */
	list(dep: Ark.DriverDependency): Promise<Ark.StoredConnection[]>;
	/**
	 * Load a single stored connection from disk.
	 */
	load(
		dep: Ark.DriverDependency,
		arg: { id: string }
	): Promise<Ark.StoredConnection>;
	/**
	 * Save a connection using just a uri
	 */
	save(
		dep: Ark.DriverDependency,
		arg: { type: "uri"; config: URIConfiguration }
	): Promise<string>;
	/**
	 * Save a connection using granular configurations
	 */
	save(
		dep: Ark.DriverDependency,
		arg: { type: "config"; config: Ark.StoredConnection }
	): Promise<string>;
	/**
	 * Delete a stored conneection from disk.
	 */
	delete(dep: Ark.DriverDependency, arg: { id: string }): Promise<void>;
	/**
	 * Connect and create cache entry for a stored connection.
	 */
	connect(dep: Ark.DriverDependency, arg: { id: string }): Promise<void>;
	/**
	 * Disconnect a cached connection.
	 */
	disconnect(dep: Ark.DriverDependency, arg: { id: string }): Promise<void>;
	/**
	 * List databases for a cached connection
	 */
	listDatabases(
		dep: Ark.DriverDependency,
		arg: { id: string }
	): Promise<ListDatabasesResult["databases"]>;
}

export const Connection: Connection = {
	info: async ({ memoryStore }, { id }) => {
		const client = memoryStore.get(id).connection;
		if (client) {
			const admin = client.db().admin();
			const serverStatus = await admin.serverStatus();

			const result: GetConnectionResult = {};

			const replSet = serverStatus.repl;

			if (replSet) {
				const replSetStatus = await admin.replSetGetStatus();
				const members = replSetStatus.members;
				result.replicaSetDetails = {
					members,
					set: replSetStatus.set,
				};
			}

			return result;
		} else {
			throw new Error("Connection not found!");
		}
	},
	list: async ({ diskStore }) => {
		const connections = await diskStore.getAll();
		return connections as Ark.StoredConnection[];
	},
	load: async ({ diskStore }, { id }) => {
		const config = await diskStore.get(id);
		const uri = getConnectionUri(config);
		return { ...config, uri };
	},
	connect: async ({ diskStore, memoryStore }, { id }) => {
		if (await diskStore.has(id)) {
			const config = await diskStore.get(id);

			let server: Server | void;
			if (config.ssh && config.ssh.useSSH) {
				server = await sshTunnel(config.ssh, config.hosts);
				if (server) {
					server.on("close", () => console.log("SSH connection closed"));
					server.on("error", () => console.log("SSH connection errored"));
				} else {
					throw new Error("Unable to make ssh connection.");
				}
			}

			const connectionUri = getConnectionUri(config);
			const client = new MongoClient(connectionUri);
			const connection = await client.connect();
			const listDatabaseResult = await connection.db().admin().listDatabases();
			const connectionDetails: MemEntry = { connection, databases: listDatabaseResult.databases };

			if (config.ssh && server) {
				connectionDetails.server = server;
			}

			memoryStore.save(id, connectionDetails);
		} else {
			throw new Error("Connection not found!");
		}
	},
	disconnect: async ({ memoryStore }, { id }) => {
		const entry = memoryStore.get(id);
		if (entry && entry.connection) {
			await entry.connection.close();

			if (entry.server) {
				entry.server.close();
			}

			memoryStore.drop(id);
		} else {
			throw new Error("Connection not found!");
		}
	},
	save: async ({ diskStore }, { type, config }) => {
		const options: MongoClientOptions = {};
		let hosts: Array<string>;

		if (isURITypeConfig(type, config)) {
			const id = nanoid();
			const parsedUri = mongoUri.parse(config.uri);
			if (parsedUri.scheme.includes("+srv")) {
				const hostdetails = parsedUri.hosts[0];
				hosts = (await lookupSRV(`_mongodb._tcp.${hostdetails.host}`)).map(
					(record) => `${record.name}:${record.port || 27017}`
				);

				options.tls = true;
				options.tlsCertificateFile = `${ARK_FOLDER_PATH}/certs/ark.crt`;
				options.authSource = "admin";
			} else {
				hosts = parsedUri.hosts.map(
					(host) => `${host.host}:${host.port || 27017}`
				);
			}

			await diskStore.set(id, {
				id,
				protocol: parsedUri.scheme,
				name: config.name,
				type: hosts.length > 1 ? "replicaSet" : "directConnection",
				hosts: hosts,
				username: parsedUri.username,
				password: parsedUri.password,
				database: parsedUri.database,
				options: { ...parsedUri.options, ...options },
			});
			return id;
		} else {
			const id = config.id || nanoid();

			if (!config.options.tls) {
				const { tls: _, tlsCertificateFile: __, ...formattedOptions } = options;

				await diskStore.set(id, {
					...config,
					options: { ...formattedOptions },
					id,
				});
			} else if (config.options.tls && !config.options.tlsCertificateFile) {
				config.options.tlsCertificateFile = `${ARK_FOLDER_PATH}/certs/ark.crt`;
				await diskStore.set(id, {
					...config,
					id,
				});
			}

			return id;
		}
	},
	delete: async ({ diskStore }, { id }) => {
		await diskStore.remove(id);
	},
	listDatabases: async function ({ memoryStore }, { id }) {
		const entry = memoryStore.get(id);

		if (entry) {
			if (entry.server && !entry.server.listening) {
				throw new Error(ERRORS.AR600);
			}

			const client = entry.connection;
			const db = client.db().admin();
			const result = await db.listDatabases({ nameOnly: false });
			// Incorrect type from mongo driver
			return result.databases;
		} else {
			throw new Error("Entry not found");
		}
	},
};

const sshTunnel = async (
	sshConfig: Ark.StoredConnection["ssh"],
	hosts: Array<string>
): Promise<ReturnType<typeof tunnel> | void> => {
	if (!sshConfig) {
		return;
	}

	const host = hosts[0].split(":")[0];
	const port = hosts[0].split(":")[1]
		? Number(hosts[0].split(":")[1])
		: undefined;

	const tunnelConfig: Config = {
		username: sshConfig.username,
		host: sshConfig.host,
		port: Number(sshConfig.port),
		dstHost: sshConfig.mongodHost || "127.0.0.1",
		dstPort: Number(sshConfig.mongodPort) || 27017,
		localHost: host || "127.0.0.1",
		localPort: port,
	};

	if (sshConfig.privateKey) {
		tunnelConfig.privateKey = sshConfig.privateKey;
		tunnelConfig.passphrase = sshConfig.passphrase || "";
	} else {
		tunnelConfig.password = sshConfig.password;
	}

	return new Promise((resolve, reject) => {
		tunnel(tunnelConfig, (err, server) => {
			if (err) {
				reject(err);
			}

			resolve(server);
		});
	});
};

const getConnectionUri = ({
	hosts,
	database = "admin",
	username,
	password,
	options,
}: Ark.StoredConnection) => {
	const uri = mongoUri.format({
		hosts: hosts.map((host) => ({
			host: host.split(":")[0],
			port: host.split(":")[1] ? parseInt(host.split(":")[1]) : undefined,
		})),
		scheme: "mongodb",
		database,
		options,
		username,
		password,
	});

	return uri;
};

const lookupSRV = (connectionString: string): Promise<SrvRecord[]> => {
	return netPromises.resolveSrv(connectionString);
};

function isURITypeConfig(
	type: "uri" | "config",
	config: URIConfiguration | Ark.StoredConnection
): config is URIConfiguration {
	if (type === "uri") return true;
	return false;
}
