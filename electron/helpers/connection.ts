import { MongoClient, MongoClientOptions } from "mongodb";
import { connectionStore } from "../stores/connection";

interface Configuration {
	name: string;
	members: Array<String>;
	username?: string;
	password?: string;
	database: string;
	options: MongoClientOptions;
}

async function createConnection(
	type: "advanced",
	configuration: Configuration
): Promise<string>;
async function createConnection(
	type: "uri",
	configuration: { name: string; uri: string; tls?: boolean }
): Promise<string>;
async function createConnection(
	type: "uri" | "advanced",
	configuration: any
): Promise<string> {
	let connection: MongoClient;
	if (type === "uri") {
		connection = await MongoClient.connect(configuration.uri);
	} else {
		connection = await MongoClient.connect(
			getConnectionUri(configuration, configuration.options),
			configuration.options as MongoClientOptions
		);
	}

	return connectionStore().saveConnection(connection);
}

const getConnectionUri = (
	{ members, database = "admin", username, password }: Configuration,
	options: MongoClientOptions
) => {
	const optionsString = Object.entries(options).reduce(
		(prevOption, option) => `${prevOption}?${option[0]}=${option[1]}`,
		""
	);

	const auth = username && password ? `${username}:${password}@` : "";
	return `mongodb://${auth}${members.join(",")}/${
		database || options.authSource
	}${optionsString}`;
};
