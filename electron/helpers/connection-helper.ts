import { MongoClient, MongoClientOptions } from "mongodb";
import { resolveSrv, SrvRecord } from "dns";
import { nanoid } from "nanoid";
import { URL } from "url";
import { diskStore } from "../stores/disk";
import { memoryStore } from "../stores/memory";
import { ARK_FOLDER_PATH } from "../constants";

interface URIConfiguration {
	uri: string;
	name: string;
}

interface ConnectionHelperMethods {
	list(): Promise<Ark.StoredConnection[]>;
	get(id: string): Promise<Ark.StoredConnection>;
	save(type: "uri", config: URIConfiguration): Promise<string>;
	save(type: "config", config: Ark.StoredConnection): Promise<string>;
	connect(uri: string): Promise<MongoClient>;
	disconnect(id: string): Promise<void>;
	delete(id: string): Promise<void>;
}

interface CollectionHelper {
	(): ConnectionHelperMethods;
}

export const ConnectionHelper: CollectionHelper = () => {
	const disk = diskStore();
	const memory = memoryStore();
	return {
		list: async () => {
			const connections = await disk.getAll("connections");
			return connections as Ark.StoredConnection[];
		},
		get: async (id) => {
			const config = await disk.get("connections", id);
			return config;
		},
		connect: async (id) => {
			if (await disk.has("connections", id)) {
				const config = await disk.get("connections", id);
				const connectionUri = getConnectionUri(config);
				const client = new MongoClient(connectionUri, config.options);
				const connection = await client.connect();
				if (connection) {
					memory.save(id, connection);
				}
				return client;
			} else {
				throw new Error("Connection not found!");
			}
		},
		disconnect: async (id) => {
			const item = memory.get(id);
			if (item) {
				const client = item.connection;
				await client.close();
				memory.drop(id);
			} else {
				throw new Error("Connection not found!");
			}
		},
		save: async (type, config) => {
			const id = nanoid();
			const options: MongoClientOptions = {};
			let members: Array<string>;

			if (isURITypeConfig(type, config)) {
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
				if (config.options.tls && !config.options.tlsCertificateFile) {
					config.options.tlsCertificateFile = `${ARK_FOLDER_PATH}/certs/ark.crt`;
				}

				await disk.set("connections", id, {
					...config,
					id,
				});

				return id;
			}
		},
		delete: async (id: string) => {
			await disk.remove("connections", id);
		},
	};
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
	return `mongodb://${auth}${members.join(",")}/${
		options.authSource || database
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
