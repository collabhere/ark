import { ListDatabasesResult, MongoClient, MongoClientOptions } from "mongodb";
import { resolveSrv, SrvRecord } from "dns";
import { nanoid } from "nanoid";
import { URL } from "url";

import disk from "../stores/disk";
import memory from "../stores/memory";

import { ARK_FOLDER_PATH } from "../../utils/constants";

interface URIConfiguration {
	uri: string;
	name: string;
}

export interface Connection {
	/**
	 * Load all stored connections from disk.
	 */
	list(): Promise<Ark.StoredConnection[]>;
	/**
	 * Load a single stored connection from disk.
	 */
	load(arg: { id: string; }): Promise<Ark.StoredConnection>;
	/**
	 * Save a connection using just a uri
	 */
	save(arg: { type: "uri"; config: URIConfiguration; }): Promise<string>;
	/**
	 * Save a connection using granular configurations
	 */
	save(arg: { type: "config"; config: Ark.StoredConnection; }): Promise<string>;
	/**
	 * Delete a stored conneection from disk.
	 */
	delete(arg: { id: string; }): Promise<void>;
	/**
	 * Connect and create cache entry for a stored connection.
	 */
	connect(arg: { id: string; }): Promise<void>;
	/**
	 * Disconnect a cached connection.
	 */
	disconnect(arg: { id: string; }): Promise<void>;
	/**
	 * List databases for a cached connection
	 */
	listDatabases(arg: { id: string }): Promise<ListDatabasesResult>;
}

export const Connection: Connection = {
	list: async () => {
		const connections = await disk.getAll("connections");
		return connections as Ark.StoredConnection[];
	},
	load: async ({ id }) => {
		const config = await disk.get("connections", id);
		const uri = getConnectionUri(config);
		return { ...config, uri };
	},
	connect: async ({ id }) => {
		if (await disk.has("connections", id)) {
			const config = await disk.get("connections", id);
			const connectionUri = getConnectionUri(config);
			const client = new MongoClient(connectionUri, config.options);
			const connection = await client.connect();
			const databases = await connection.db().admin().listDatabases();
			memory.save(id, { connection, databases });
		} else {
			throw new Error("Connection not found!");
		}
	},
	disconnect: async ({ id }) => {
		const client = memory.get(id).connection;
		if (client) {
			await client.close();
			memory.drop(id);
		} else {
			throw new Error("Connection not found!");
		}
	},
	save: async ({ type, config }) => {
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

			await disk.set("connections", id, {
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

				await disk.set("connections", id, {
					...config,
					options: { ...formattedOptions },
					id,
				});
			} else if (config.options.tls && !config.options.tlsCertificateFile) {
				config.options.tlsCertificateFile = `${ARK_FOLDER_PATH}/certs/ark.crt`;
				await disk.set("connections", id, {
					...config,
					id,
				});
			}

			return id;
		}
	},
	delete: async ({ id }) => {
		await disk.remove("connections", id);
	},
	listDatabases: async ({ id }) => {
		const entry = memory.get(id);
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
	const optionsString = Object.entries(options).reduce(
		(prevOption, option) => `${prevOption}?${option[0]}=${option[1]}`,
		""
	);

	const auth = username && password ? `${username}:${password}@` : "";
	return `mongodb://${auth}${members.join(",")}/${options.authSource || database
		}${optionsString}`;
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
