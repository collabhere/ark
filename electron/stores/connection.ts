import { MongoClient } from "mongodb";

export const store = new Map<string, MongoClient>();

export const saveConnection = (id: string, connection: MongoClient) => {
	if (connection) {
		store.set(id, connection);
		return id;
	} else {
		throw new Error("Unable to save an empty connection!");
	}
};

export const getConnection = (id: string): MongoClient | undefined => {
	if (store.has(id)) {
		return store.get(id);
	} else {
		throw new Error(`No connection exists with id: ${id}!`);
	}
};

export const deleteConnection = (id: string) => {
	if (store.has(id)) {
		return store.delete(id);
	}
};

export const getActiveConnectionIds = () => store.keys();
