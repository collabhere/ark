import { ListDatabasesResult, MongoClient, MongoClientOptions } from "mongodb";
import { resolveSrv, SrvRecord } from "dns";
import { nanoid } from "nanoid";
import { URL } from "url";
import { stringify } from "querystring";

import { ARK_FOLDER_PATH } from "../../utils/constants";
import * as ObjectUtils from "../../utils/object";

interface URIConfiguration {
	uri: string;
	name: string;
}

export interface Connection {
	/**
	 * Load all stored connections from disk.
	 */
	list(dep: Ark.DriverDependency): Promise<Ark.StoredConnection[]>;
	/**
	 * Load a single stored connection from disk.
	 */
	load(dep: Ark.DriverDependency, arg: { id: string; }): Promise<Ark.StoredConnection>;
	/**
	 * Save a connection using just a uri
	 */
	save(dep: Ark.DriverDependency, arg: { type: "uri"; config: URIConfiguration; }): Promise<string>;
	/**
	 * Save a connection using granular configurations
	 */
	save(dep: Ark.DriverDependency, arg: { type: "config"; config: Ark.StoredConnection; }): Promise<string>;
	/**
	 * Delete a stored conneection from disk.
	 */
	delete(dep: Ark.DriverDependency, arg: { id: string; }): Promise<void>;
	/**
	 * Connect and create cache entry for a stored connection.
	 */
	connect(dep: Ark.DriverDependency, arg: { id: string; }): Promise<void>;
	/**
	 * Disconnect a cached connection.
	 */
	disconnect(dep: Ark.DriverDependency, arg: { id: string; }): Promise<void>;
	/**
	 * List databases for a cached connection
	 */
	listDatabases(dep: Ark.DriverDependency, arg: { id: string }): Promise<ListDatabasesResult>;
}

export const Connection: Connection = {
	list: async ({ diskStore }) => {
		const connections = await diskStore.getAll("connections");
		return connections as Ark.StoredConnection[];
	},
	load: async ({ diskStore }, { id }) => {
		const config = await diskStore.get("connections", id);
		const uri = getConnectionUri(config);
		return { ...config, uri };
	},
	connect: async ({ diskStore, memoryStore }, { id }) => {
		if (await diskStore.has("connections", id)) {
			const config = await diskStore.get("connections", id);
			const connectionUri = getConnectionUri(config);
			const client = new MongoClient(connectionUri, config.options);
			const connection = await client.connect();
			const databases = await connection.db().admin().listDatabases();
			memoryStore.save(id, { connection, databases });
		} else {
			throw new Error("Connection not found!");
		}
	},
	disconnect: async ({ memoryStore }, { id }) => {
		const client = memoryStore.get(id).connection;
		if (client) {
			await client.close();
			memoryStore.drop(id);
		} else {
			throw new Error("Connection not found!");
		}
	},
	save: async ({ diskStore }, { type, config }) => {
		const options: MongoClientOptions = {};
		let members: Array<string>;

		if (isURITypeConfig(type, config)) {
			const id = nanoid();
			const parsedUri = new URL(config.uri);
			if (parsedUri.protocol.includes("+srv")) {
				members = (
					await lookupSRV(`_mongodb._tcp.${parsedUri.hostname}`)
				).map((record) => `${record.name}:${record.port || 27017}`);

				options.tls = true;
				options.tlsCertificateFile = `${ARK_FOLDER_PATH}/certs/ark.crt`;
				options.authSource = "admin";
			} else {
				members = [`${parsedUri.hostname}:${parsedUri.port || 27017}`];
			}

			const uriOptions = parsedUri.search
				.slice(1, parsedUri.search.length)
				.split("&")
				.reduce<any>((acc, option) => {
					const [key, value] = option.split("=");

					acc[key] = value;
					return acc;
				}, {});

			await diskStore.set("connections", id, {
				id,
				protocol: parsedUri.protocol,
				name: config.name,
				members,
				username: parsedUri.username,
				password: parsedUri.password,
				database: parsedUri.pathname.slice(1, parsedUri.pathname.length),
				options: { ...uriOptions, ...options },
			});
			return id;
		} else {
			const id = config.id || nanoid();

			if (!config.options.tls) {
				const {
					tls: _,
					tlsCertificateFile: __,
					...formattedOptions
				} = options;

				await diskStore.set("connections", id, {
					...config,
					options: { ...formattedOptions },
					id,
				});
			} else if (config.options.tls && !config.options.tlsCertificateFile) {
				config.options.tlsCertificateFile = `${ARK_FOLDER_PATH}/certs/ark.crt`;
				await diskStore.set("connections", id, {
					...config,
					id,
				});
			}

			return id;
		}
	},
	delete: async ({ diskStore }, { id }) => {
		await diskStore.remove("connections", id);
	},
	listDatabases: async ({ memoryStore }, { id }) => {
		const entry = memoryStore.get(id);
		if (entry) {
			const client = entry.connection;
			const db = client.db().admin();
			const result = await db.listDatabases({ authorizedDatabases: true, nameOnly: false });
			// Incorrect type from mongo driver
			return (result as any).databases as ListDatabasesResult;
		} else {
			throw new Error("Entry not found");
		}
	}
};

const getConnectionUri = ({
	members,
	database = "admin",
	username,
	password,
	options,
}: Ark.StoredConnection) => {

	const querystring = stringify(
		ObjectUtils.pick(options, ["authSource"])
	);

	const userpass = username && password ? `${username}:${password}@` : "";

	const hoststring = members.join(",");

	return `mongodb://${userpass}${hoststring}/${database}?${querystring}`;
};

const lookupSRV = (connectionString: string): Promise<SrvRecord[]> => {
	return resolveSrv.__promisify__(connectionString);
};

function isURITypeConfig(
	type: "uri" | "config",
	config: URIConfiguration | Ark.StoredConnection
): config is URIConfiguration {
	if (type === "uri") return true;
	return false;
}
