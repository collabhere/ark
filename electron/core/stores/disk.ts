import electronStorage from "electron-json-storage";
import { ARK_FOLDER_PATH } from "../../constants";
import { promisifyCallback } from "../../../util/misc";

electronStorage.setDataPath(ARK_FOLDER_PATH);

export interface DiskStore<T> {
	/**
	 * @example
	 *  get('connections', 'testConnection');
	 *  => Should return { value: 'test'};
	 */
	get(key: string): Promise<T>;
	getAll(): Promise<T[]>;
	set(key: string, value: Partial<T>): Promise<void>;
	remove(key: string): Promise<void>;
	has(key: string): Promise<boolean>;
}

export const createDiskStore = <T>(module: string): DiskStore<T> => {
	/**
	 * Usage example:
	 *  set('connections', 'testConnection', { value: 'test'});
	 *  => Should create a testConnection.json file in ~/ark/connections dir;
	 */
	const set = (key: string, value: Record<string, any>) => {
		return promisifyCallback(electronStorage, electronStorage.set, key, value, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		}) as Promise<void>;
	};

	const get = (key: string): Promise<any> => {
		return promisifyCallback(electronStorage, electronStorage.get, key, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		}) as Promise<T>;
	};

	/**
	 * Usage example:
	 *  get('connections', 'testConnection');
	 *  => Should remove testConnection.json file from ~/ark/connections dir;
	 */
	const remove = (key: string) => {
		return promisifyCallback(electronStorage, electronStorage.remove, key, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		}) as Promise<void>;
	};

	const has = (key: string) => {
		return promisifyCallback(electronStorage, electronStorage.has, key, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		}) as Promise<boolean>;
	};

	const getAll = () => {
		return promisifyCallback(electronStorage, electronStorage.getAll, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		}) as Promise<T[]>;
	};

	return { get, set, remove, has, getAll };
};
