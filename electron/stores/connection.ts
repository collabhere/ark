import { MongoClient } from "mongodb";
import { nanoid } from "nanoid";

const store = new Map<string, MongoClient>();

export const connectionStore = () => {
	const saveConnection = (connection: MongoClient) => {
		if (connection) {
			const id = nanoid();
			store.set(id, connection);

			return id;
		} else {
			throw new Error("Unable to save an empty connection!");
		}
	};

	const getConnection = (id: string): MongoClient => {
		if (store.has(id)) {
			return store.get(id);
		} else {
			throw new Error(`No connection exists with id: ${id}!`);
		}
	};

	const deleteConnection = (id: string) => {
		if (store.has(id)) {
			return store.delete(id);
		}
	};

	return { getConnection, saveConnection, deleteConnection };
};
