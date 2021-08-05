import { MongoClient, MongoClientOptions } from "mongodb";
import {
	saveConnection,
	getActiveConnectionIds,
	getConnection,
	deleteConnection,
} from "../stores/connection";
import { resolveSrv, SrvRecord } from "dns";
import { nanoid } from "nanoid";
import os from "os";
import { diskStore } from "../stores/disk";

interface Configuration {
	name: string;
	members: Array<String>;
	username?: string;
	password?: string;
	database: string;
	options: MongoClientOptions;
}

const connect = async (uri: string, options: MongoClientOptions) => {
	return await MongoClient.connect(uri, options);
};

export async function createConnection(id: string): Promise<any> {
	const store = diskStore();

	if (await store.has("connections", id)) {
		const config = (await store.get("connections", id)) as Configuration;
		const connectionUri = getConnectionUri(config);

		const connection = await connect(connectionUri, config.options);

		if (connection) {
			saveConnection(id, connection);
		}
	} else {
		throw new Error("No connections found!");
	}
}

const getConnectionUri = ({
	members,
	database = "admin",
	username,
	password,
	options,
}: Configuration) => {
	const optionsString = Object.entries(options).reduce(
		(prevOption, option) => `${prevOption}?${option[0]}=${option[1]}`,
		""
	);

	const auth = username && password ? `${username}:${password}@` : "";
	return `mongodb://${auth}${members.join(",")}/${
		options.authSource || database
	}${optionsString}`;
};

export async function saveNewConnection(
	type: "uri",
	config: { uri: string; name: string }
): Promise<void>;

export async function saveNewConnection(
	type: "config",
	config: Configuration
): Promise<void>;

export async function saveNewConnection(
	type: "config" | "uri",
	config: any
): Promise<void> {
	const store = diskStore();
	const id = nanoid();

	let members: Array<string>,
		options: MongoClientOptions = {};
	if (type === "uri") {
		const parsedUri = new URL(config.uri);
		if (parsedUri.protocol.includes("+srv")) {
			members = (
				await performLookup(`_mongodb._tcp.${parsedUri.hostname}`)
			).map((record) => `${record.name}:${record.port || 27017}`);

			options.tls = true;
			options.tlsCertificateFile = `${os.homedir()}/ark/certs/ark.crt`;
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

		await store.set("connections", id, {
			id,
			protocol: parsedUri.protocol,
			name: config.name,
			members,
			username: parsedUri.username,
			password: parsedUri.password,
			database: parsedUri.pathname.slice(1, parsedUri.pathname.length),
			options: { ...uriOptions, ...options },
		});
	} else {
		if (options.tls && !options.tlsCertificateFile) {
			options.tlsCertificateFile = `${os.homedir()}/ark/certs/ark.crt`;
		}

		await store.set("connections", id, options);
	}
}

export const performLookup = (
	connectionString: string
): Promise<Array<SrvRecord>> => {
	return new Promise((resolve, reject) => {
		resolveSrv(connectionString, (err, addresses) => {
			if (err) {
				reject(err);
			}

			resolve(addresses);
		});
	});
};

export const getAllConnections = () => diskStore().getAll("connections");

export const getConnectionById = (id: string) =>
	diskStore().get("connections", id);

export const getActiveConnections = () => getActiveConnectionIds();

export const removeActiveConnection = (id: string) => deleteConnection(id);
