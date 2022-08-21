import { ERR_CODES } from "../../../util/errors";

export type ListResult = Array<{ key: string; value: any }>;
export interface MemoryStore<T> {
	save(id: string, entry: Partial<T>): string;
	get(id: string): T;
	has(id: string): boolean;
	drop(id: string): boolean;
	list(): ListResult;
	keys(): string[];
}

export const createMemoryStore = <T extends Record<string, any>>(): MemoryStore<T> => {
	const store = new Map<string, Partial<T>>();

	const keys = () => Array.from(store.keys());

	const list = () =>
		Array.from(store.entries()).reduce<ListResult>((acc, [key, value]) => (acc.push({ key, value }), acc), []);

	const has = (k: string) => store.has(k);

	const save = (id: string, entry: Partial<T>) => {
		if (entry) {
			const old = store.get(id);
			if (old) store.set(id, { ...old, ...entry });
			else store.set(id, entry);
			return id;
		} else {
			throw new Error(ERR_CODES.CORE$MEM_STORE$INVALID_INPUT);
		}
	};

	const get = (id: string): T => {
		if (store.has(id)) {
			return store.get(id) as T;
		} else {
			throw new Error(ERR_CODES.CORE$MEM_STORE$NO_ENTRY);
		}
	};

	const drop = (id: string) => {
		if (store.has(id)) {
			return store.delete(id);
		} else {
			return false;
		}
	};

	return { save, get, drop, has, list, keys };
};
