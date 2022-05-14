import { CollectionInfo, CollStats, Document } from "mongodb";
import { ERR_CODES } from "../../../../util/errors";
export interface Database {
	listCollections(
		dep: Ark.DriverDependency,
		arg: { id: string; database?: string }
	): Promise<CollectionInfo[]>;
	createDatabase(
		dep: Ark.DriverDependency,
		arg: { id: string; database: string; collection: string }
	): Promise<{ db: string }>;
	dropDatabase(
		dep: Ark.DriverDependency,
		arg: { id: string; database?: string }
	): Promise<{ ok: boolean }>;
	createCollection(
		dep: Ark.DriverDependency,
		arg: { id: string; database: string; collection: string }
	): Promise<{ collection: string }>;
	dropCollection(
		dep: Ark.DriverDependency,
		arg: { id: string; database: string; collection: string }
	): Promise<{ ok: boolean }>;
	listIndexes(
		dep: Ark.DriverDependency,
		arg: { id: string; database: string; collection: string }
	): Promise<Document[]>;
	getCollectionStats(
		dep: Ark.DriverDependency,
		arg: { id: string; database: string; collection: string }
	): Promise<CollStats>;
	dropIndex(
		dep: Ark.DriverDependency,
		arg: { id: string; database: string; collection: string; index: string }
	): Promise<boolean>;
	dropAllIndexes(
		dep: Ark.DriverDependency,
		arg: { id: string; database: string; collection: string; index: string }
	): Promise<boolean>;
}

export const Database: Database = {
	listCollections: async ({ memEntry }, { database }) => {
		if (!memEntry) {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
		}

		if (memEntry.server && !memEntry.server.listening) {
			throw new Error(ERR_CODES.CORE$DRIVER$SSH_TUNNEL_CLOSED);
		}

		const client = memEntry.connection;
		const db = client.db(database);
		const cursor = await db.listCollections(
			{},
			{ nameOnly: false, dbName: database }
		);
		const collections = await cursor.toArray();
		return collections;
	},
	createDatabase: async ({ memEntry }, { database, collection }) => {
		if (!memEntry) {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
		}
		const client = memEntry.connection;
		const db = client.db(database);
		await db.createCollection(collection);
		return { db: db.databaseName };
	},
	dropDatabase: async ({ memEntry }, { database }) => {
		if (!memEntry) {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
		}
		const client = memEntry.connection;
		const db = client.db(database);
		const result = await db.dropDatabase();
		return { ok: result };
	},
	createCollection: async ({ memEntry }, { database, collection }) => {
		if (!memEntry) {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
		}
		const client = memEntry.connection;
		const db = client.db(database);
		await db.createCollection(collection);
		return { collection };
	},
	dropCollection: async ({ memEntry }, { database, collection }) => {
		if (!memEntry) {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
		}
		const client = memEntry.connection;
		const db = client.db(database);
		const result = await db.dropCollection(collection);
		return { ok: result };
	},
	listIndexes: async ({ memEntry }, { database, collection }) => {
		if (!memEntry) {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
		}

		const client = memEntry.connection;
		const db = client.db(database);
		const indexStats = await db
			.collection(collection)
			.aggregate([{ $indexStats: {} }])
			.toArray();

		console.log(`getting indexes`);
		console.log(indexStats);

		return indexStats;
	},
	getCollectionStats: async ({ memEntry }, { database, collection }) => {
		if (!memEntry) {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
		}

		const client = memEntry.connection;
		const db = client.db(database);
		const collectionStats = await db.collection(collection).stats();

		console.log("getting stats info");
		console.log(collectionStats);

		return collectionStats;
	},
	dropIndex: async ({ memEntry }, { database, collection, index }) => {
		if (!memEntry) {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
		}

		const client = memEntry.connection;

		const db = client.db(database);
		await db.collection(collection).dropIndex(index);

		return true;
	},
	dropAllIndexes: async ({ memEntry }, { database, collection }) => {
		if (!memEntry) {
			throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
		}

		const client = memEntry.connection;
		const db = client.db(database);
		await db.collection(collection).dropIndexes();

		return true;
	},
};
