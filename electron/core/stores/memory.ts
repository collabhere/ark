import type { ListDatabasesResult, MongoClient } from "mongodb";

interface MemEntry {
	connection: MongoClient;
	databases: ListDatabasesResult;
}

export const memoryStore = () => {
	const store = new Map<string, Partial<MemEntry>>();

	const save = (id: string, entry: Partial<MemEntry>) => {
		if (entry) {
			const old = store.get(id);
			if (old) store.set(id, { ...old, ...entry });
			else store.set(id, entry);
			return id;
		} else {
			throw new Error("Invalid input to memory.save");
		}
	};

	const get = (id: string): MemEntry => {
		if (store.has(id)) {
			return store.get(id) as MemEntry;
		} else {
			throw new Error(`No mem entry found for id: ${id}!`);
		}
	};

	const drop = (id: string) => {
		if (store.has(id)) {
			return store.delete(id);
		}
	};

	return { save, get, drop };
};

export default memoryStore();
