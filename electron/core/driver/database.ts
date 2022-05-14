import { CollectionInfo, CollStats, Document } from "mongodb";
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
	listCollections: async ({ memoryStore }, { id, database }) => {
		const entry = memoryStore.get(id);
		if (entry) {
			if (entry.server && !entry.server.listening) {
				throw new Error("SSH tunnel closed! Unable to process request.");
			}

			const client = entry.connection;
			const db = client.db(database);
			const cursor = await db.listCollections(
				{},
				{ nameOnly: false, dbName: database }
			);
			const collections = await cursor.toArray();
			return collections;
		} else {
			throw new Error("Entry not found");
		}
	},
	createDatabase: async ({ memoryStore }, { id, database, collection }) => {
		const entry = memoryStore.get(id);
		if (entry) {
			const client = entry.connection;
			const db = client.db(database);
			await db.createCollection(collection);
			return { db: db.databaseName };
		} else {
			throw new Error("Entry not found");
		}
	},
	dropDatabase: async ({ memoryStore }, { id, database }) => {
		const entry = memoryStore.get(id);
		if (entry) {
			const client = entry.connection;
			const db = client.db(database);
			const result = await db.dropDatabase();
			return { ok: result };
		} else {
			throw new Error("Entry not found");
		}
	},
	createCollection: async ({ memoryStore }, { id, database, collection }) => {
		const entry = memoryStore.get(id);
		if (entry) {
			const client = entry.connection;
			const db = client.db(database);
			const result = await db.createCollection(collection);
			return { collection };
		} else {
			throw new Error("Entry not found");
		}
	},
	dropCollection: async ({ memoryStore }, { id, database, collection }) => {
		const entry = memoryStore.get(id);
		if (entry) {
			const client = entry.connection;
			const db = client.db(database);
			const result = await db.dropCollection(collection);
			return { ok: result };
		} else {
			throw new Error("Entry not found");
		}
	},
	listIndexes: async ({ memoryStore }, { id, database, collection }) => {
		const entry = memoryStore.get(id);

		if (entry) {
			const client = entry.connection;
			const db = client.db(database);
			const indexStats = await db
				.collection(collection)
				.aggregate([{ $indexStats: {} }])
				.toArray();
			const collectionStats = await db.collection(collection).stats();

			console.log(`getting indexes`);
			console.log(indexStats);

			return indexStats;
		} else {
			throw new Error("Entry not found");
		}
	},
	getCollectionStats: async ({ memoryStore }, { id, database, collection }) => {
		const entry = memoryStore.get(id);

		if (entry) {
			const client = entry.connection;
			const db = client.db(database);
			const collectionStats = await db.collection(collection).stats();

			console.log("getting stats info");
			console.log(collectionStats);

			return collectionStats;
		} else {
			throw new Error("Entry not found");
		}
	},
	dropIndex: async ({ memoryStore }, { id, database, collection, index }) => {
		const entry = memoryStore.get(id);

		if (entry) {
			const client = entry.connection;
			const db = client.db(database);
			await db.collection(collection).dropIndex(index);

			return true;
		} else {
			throw new Error("Entry not found");
		}
	},
	dropAllIndexes: async ({ memoryStore }, { id, database, collection }) => {
		const entry = memoryStore.get(id);

		if (entry) {
			const client = entry.connection;
			const db = client.db(database);
			await db.collection(collection).dropIndexes();

			return true;
		} else {
			throw new Error("Entry not found");
		}
	},
};
