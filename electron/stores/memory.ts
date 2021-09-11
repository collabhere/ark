import type { MongoClient } from "mongodb";

interface MemEntry {
	connection: MongoClient;
}

export const store = new Map<string, MemEntry>();

export const save = (id: string, connection: MongoClient) => {
	if (connection) {
		store.set(id, { connection });
		return id;
	} else {
		throw new Error("Unable to save an empty connection!");
	}
};

export const get = (id: string): MongoClient | undefined => {
	if (store.has(id)) {
		return (store.get(id) as MemEntry).connection;
	} else {
		throw new Error(`No connection exists with id: ${id}!`);
	}
};

export const drop = (id: string) => {
	if (store.has(id)) {
		return store.delete(id);
	}
};

// export const memoryStore = () => {
// 	const store = new Map<string, MemEntry>();

// 	const save = (id: string, connection: MongoClient) => {
// 		if (connection) {
// 			store.set(id, { connection });
// 			return id;
// 		} else {
// 			throw new Error("Unable to save an empty connection!");
// 		}
// 	};

// 	const get = (id: string): MemEntry => {
// 		if (store.has(id)) {
// 			return store.get(id) as MemEntry;
// 		} else {
// 			throw new Error(`No mem entry found for id: ${id}!`);
// 		}
// 	};

// 	const drop = (id: string) => {
// 		if (store.has(id)) {
// 			return store.delete(id);
// 		}
// 	};

// 	return { save, get, drop };
// };
