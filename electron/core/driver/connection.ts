import { ListDatabasesResult, MongoClient, MongoClientOptions } from "mongodb";
import type { SrvRecord } from "dns";
import { promises as netPromises } from "dns";
import { nanoid } from "nanoid";
import mongoUri from "mongodb-uri";
import tunnel, { Config } from "tunnel-ssh";

import { ARK_FOLDER_PATH } from "../../utils/constants";
import { ERRORS } from "../../../util/constants";
import { MemEntry } from "../../modules/ipc";
import { Server } from "net";
import * as crypto from "crypto";
import fs from "fs";
import { UploadFile } from "antd/lib/upload/interface";

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
	 *
	 * Test connections.
	 */
	test(
		dep: Ark.DriverDependency,
		arg: {
			type: "config" | "uri";
			config: Ark.StoredConnection | URIConfiguration;
		}
	): Promise<{ status: boolean; message: string }>;
	/**
	 * Load a single stored connection from disk.
	 */
	load(
		dep: Ark.DriverDependency,
		arg: { id: string }
	): Promise<Ark.StoredConnection>;
	/**
	 * Save a connection using a URI or granular configurations
	 */
	save(
		dep: Ark.DriverDependency,
		arg: {
			type: "config" | "uri";
			config: Ark.StoredConnection | URIConfiguration;
			icon?: UploadFile<Blob>;
		}
	): Promise<string>;
	copyIcon(
		dep: Ark.DriverDependency,
		arg: {
			path: string;
			name: string;
		}
	): Promise<void>;
	fetchIcon(
		dep: Ark.DriverDependency,
		arg: {
			id: string;
		}
	): Promise<UploadFile<Blob>>;
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
			const replSet = await getReplicaSetDetails(client);
			const result: GetConnectionResult = {};

			if (replSet) {
				result.replicaSetDetails = replSet;
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
	copyIcon: async ({}, { path, name }) => {
		const destinationPath = `${ARK_FOLDER_PATH}/icons`;
		if (!fs.existsSync(destinationPath)) {
			await fs.promises.mkdir(destinationPath);
		}

		const destination = `${destinationPath}/${name}`;
		await fs.promises.copyFile(path, destination);
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

			config.password =
				config.password && config.key && config.iv
					? decrypt(config.password, config.key, config.iv)
					: config.password;

			const connectionUri = getConnectionUri(config);
			const client = new MongoClient(connectionUri);
			const connection = await client.connect();
			const databases = await connection.db().admin().listDatabases();
			const connectionDetails: MemEntry = { connection, databases };

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
	save: async ({ diskStore, iconStore }, connectionArgs) => {
		const config = await getConnectionConfig(connectionArgs);

		if (config.icon && connectionArgs.icon) {
			await iconStore.set(config.id, connectionArgs.icon);
		} else {
			await iconStore.remove(config.id);
		}

		await diskStore.set(config.id, {
			...config,
		});

		return config.id;
	},
	fetchIcon: async ({ iconStore }, connectionArgs) => {
		return await iconStore.get(connectionArgs.id);
	},
	test: async (_, connectionArgs) => {
		try {
			const config = await getConnectionConfig(connectionArgs);
			if (config.ssh && config.ssh.useSSH) {
				await sshTunnel(config.ssh, config.hosts);
			}

			const connectionUri = getConnectionUri(config);
			const client = new MongoClient(connectionUri);
			await client.connect();

			return {
				status: true,
				message: "Connection Successful",
			};
		} catch (err) {
			return {
				status: false,
				message:
					err && err instanceof Error
						? err.message
						: typeof err === "string"
						? err
						: "",
			};
		}
	},
	delete: async ({ diskStore, iconStore }, { id }) => {
		await diskStore.remove(id);
		await iconStore.remove(id);
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

const getReplicaSetDetails = async (
	client: MongoClient
): Promise<GetConnectionResult["replicaSetDetails"] | void> => {
	const connection = await client.connect();
	const admin = connection.db().admin();
	const serverStatus = await admin.serverStatus();
	const replSet = serverStatus.repl;

	if (replSet) {
		const replSetStatus = await admin.replSetGetStatus();
		const members = replSetStatus.members;
		return {
			members,
			set: replSetStatus.set,
		};
	}
};

const encrypt = (password: string) => {
	const iv = crypto.randomBytes(16);
	const key = crypto.randomBytes(32);

	const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
	return {
		pwd: Buffer.concat([cipher.update(password), cipher.final()]).toString(
			"hex"
		),
		key: key.toString("hex"),
		iv: iv.toString("hex"),
	};
};

const decrypt = (password: string, key: string, iv: string) => {
	const decipher = crypto.createDecipheriv(
		"aes-256-cbc",
		Buffer.from(key, "hex"),
		Buffer.from(iv, "hex")
	);
	return decipher.update(password, "hex", "utf8") + decipher.final("utf8");
};

const getConnectionConfig = async ({
	type,
	config,
}: Parameters<Connection["save"]>[1]): Promise<Ark.StoredConnection> => {
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

			if (hosts && hosts.length > 0) {
				const client = new MongoClient(config.uri);
				const replicaSetDetails = await getReplicaSetDetails(client);

				if (replicaSetDetails) {
					options.replicaSet = replicaSetDetails.set;
				}
			}

			options.tls = true;
			options.tlsCertificateFile = `${ARK_FOLDER_PATH}/certs/ark.crt`;
			options.authSource = "admin";
		} else {
			hosts = parsedUri.hosts.map(
				(host) => `${host.host}:${host.port || 27017}`
			);
		}

		const encryption = parsedUri.password
			? encrypt(parsedUri.password)
			: undefined;

		return {
			id,
			protocol: parsedUri.scheme,
			name: config.name,
			type: hosts.length > 1 ? "replicaSet" : "directConnection",
			hosts: hosts,
			username: parsedUri.username,
			password: encryption?.pwd,
			key: encryption?.key,
			iv: encryption?.iv,
			database: parsedUri.database,
			options: { ...parsedUri.options, ...options },
			ssh: { useSSH: false },
		};
	} else {
		const id = config.id || nanoid();

		if (!config.options.tls) {
			const {
				tls: _,
				tlsCertificateFile: __,
				...formattedOptions
			} = config.options;
			config.options = { ...formattedOptions };
		} else if (config.options.tls && !config.options.tlsCertificateFile) {
			config.options.tlsCertificateFile = `${ARK_FOLDER_PATH}/certs/ark.crt`;
		}

		if (!config.username) {
			const { authMechanism: _, ...opts } = config.options;
			config.options = { ...opts };
		}

		const encryption = config.password ? encrypt(config.password) : undefined;

		config.password = encryption?.pwd;
		config.key = encryption?.key;
		config.iv = encryption?.iv;

		return {
			...config,
			id,
		};
	}
};
