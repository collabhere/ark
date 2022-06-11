import { ListDatabasesResult, MongoClient } from "mongodb";
import { Server } from "net";
import { MemEntry } from "../../../modules/ipc/types";
import { ERR_CODES } from "../../../../util/errors";
import {
	createConnectionConfigurations,
	GetConnectionResult,
	getConnectionUri,
	getReplicaSetDetails,
	sshTunnel,
	URIConfiguration
} from "./library";

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
			icon?: Ark.StoredIcon;
		}
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
	info: async ({ memEntry, storedConnection }) => {
		if (memEntry) {
			if (storedConnection) {
				const { connection } = memEntry;

				const result: GetConnectionResult = {};

				if (storedConnection.hosts && storedConnection.hosts.length > 1) {
					const replSet = await getReplicaSetDetails(connection);

					if (replSet) {
						result.replicaSetDetails = replSet;
					}
				}

				return result;
			} else {
				throw new Error(ERR_CODES.CORE$DRIVER$NO_STORED_CONNECTION);
			}
		} else {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION)
		}
	},
	list: async ({ _stores: stores }) => {
		const { diskStore } = stores;
		const connections = await diskStore.getAll();
		return connections;
	},
	load: async ({ storedConnection }) => {
		if (storedConnection) {
			const uri = getConnectionUri(storedConnection);
			return { ...storedConnection, uri };
		} else {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_STORED_CONNECTION);
		}
	},
	connect: async ({ storedConnection, _stores: stores }, { id }) => {

		if (storedConnection) {
			const {
				memoryStore
			} = stores;

			let server: Server | void;

			if (storedConnection.ssh && storedConnection.ssh.useSSH) {
				server = await sshTunnel(storedConnection.ssh, storedConnection.hosts);
				if (server) {
					server.on("close", () => console.log("SSH connection closed"));
					server.on("error", () => console.log("SSH connection errored"));
				} else {
					throw new Error(ERR_CODES.CORE$DRIVER$SSH_TUNNEL_CONN_ERR);
				}
			}

			const connectionUri = getConnectionUri(storedConnection);
			const client = new MongoClient(connectionUri);
			const connection = await client.connect();
			const listDatabaseResult = await connection.db().admin().listDatabases();
			const connectionDetails: MemEntry = {
				connection,
				databases: listDatabaseResult.databases,
			};

			if (storedConnection.ssh && server) {
				connectionDetails.server = server;
			}

			memoryStore.save(id, connectionDetails);
		} else {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_STORED_CONNECTION);
		}
	},
	disconnect: async ({ memEntry, _stores: stores }, { id }) => {

		if (memEntry) {

			const {
				memoryStore
			} = stores;

			await memEntry.connection.close();

			if (memEntry.server) {
				memEntry.server.close();
			}

			memoryStore.drop(id);

		} else {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
		}
	},
	save: async ({ _stores: stores }, args) => {

		const { diskStore, iconStore } = stores;

		const config = await createConnectionConfigurations(args);

		if (config.id && args.icon) {
			await iconStore.set(config.id, args.icon);
		} else {
			await iconStore.remove(config.id);
		}

		await diskStore.set(config.id, {
			...config,
		});

		return config.id;
	},
	test: async (_, args) => {
		try {
			const config = await createConnectionConfigurations(args);
			if (config.ssh && config.ssh.useSSH) {
				await sshTunnel(config.ssh, config.hosts);
			}

			const connectionUri = getConnectionUri(config);

			const client = new MongoClient(connectionUri);

			try {
				await client.connect();
			} catch (err) {
				console.log(err);
				return {
					status: false,
					message: "Could not connect to server"
				};
			}

			try {
				const db = client.db().admin();

				await db.listDatabases();
			} catch (err) {
				return {
					status: false,
					message: "Could not list databases"
				};
			}

			return {
				status: true,
				message: "All tests have passed",
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
	delete: async ({ _stores: stores }, { id }) => {
		const { diskStore, iconStore } = stores;
		await diskStore.remove(id);
		await iconStore.remove(id);
	},
	listDatabases: async function ({ memEntry: entry }, { id }) {

		if (entry) {

			if (entry.server && !entry.server.listening) {
				throw new Error(ERR_CODES.CORE$DRIVER$SSH_TUNNEL_CLOSED);
			}

			const client = entry.connection;
			const db = client.db().admin();
			const result = await db.listDatabases({ nameOnly: false });

			// Incorrect type from mongo driver
			return result.databases;

		} else {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
		}
	},
};
