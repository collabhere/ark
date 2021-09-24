import electronStorage from "electron-json-storage";
import { ARK_FOLDER_PATH } from "../../utils/constants";
import { promisifyCallback } from "../../utils/misc";

electronStorage.setDataPath(ARK_FOLDER_PATH);

export interface DiskStore {
	/**
	 * @example
	 *  get('connections', 'testConnection');
	 *  => Should return { value: 'test'};
	 */
	get(module: "connections", key: string): Promise<Ark.StoredConnection>;
	getAll(module: "connections"): Promise<Ark.StoredConnection[]>;
	set(module: string, key: string, value: Ark.AnyObject): Promise<void>;
	remove(module: string, key: string): Promise<void>;
	has(module: string, key: string): Promise<boolean>;
}

export const createDiskStore = (): DiskStore => {
	/**
	 * Usage example:
	 *  set('connections', 'testConnection', { value: 'test'});
	 *  => Should create a testConnection.json file in ~/ark/connections dir;
	 */
	const set = (module: string, key: string, value: Record<string, any>) => {
		return promisifyCallback(electronStorage, electronStorage.set, key, value, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		}) as Promise<void>;
	};

	const get = (module: string, key: string): Promise<any> => {
		return promisifyCallback(electronStorage, electronStorage.get, key, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		}) as Promise<Ark.StoredConnection>;
	};

	/**
	 * Usage example:
	 *  get('connections', 'testConnection');
	 *  => Should remove testConnection.json file from ~/ark/connections dir;
	 */
	const remove = (module: string, key: string) => {
		return promisifyCallback(electronStorage, electronStorage.remove, key, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		}) as Promise<void>;
	};

	const has = (module: string, key: string) => {
		return promisifyCallback(electronStorage, electronStorage.has, key, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		}) as Promise<boolean>;
	};

	const getAll = (module: string) => {
		return promisifyCallback(electronStorage, electronStorage.getAll, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		}) as Promise<Ark.StoredConnection[]>;
	};

	return { get, set, remove, has, getAll };
};
