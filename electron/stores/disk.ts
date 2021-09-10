import electronStorage from "electron-json-storage";
import os from "os";
import { ARK_FOLDER_NAME } from "../constants";

const promisifyCallback =
	(thisArg: any, func: any, ...args: any) =>
		new Promise((resolve, reject) => {
			func.call(thisArg, ...args, (err: any, data: any) => {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});

interface DiskStoreMethods {
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
interface DiskStore {
	(dirName?: string): DiskStoreMethods;
}

export const diskStore: DiskStore = (dirName: string = ARK_FOLDER_NAME) => {
	const defaultPath = os.homedir();

	electronStorage.setDataPath(`${defaultPath}/${dirName}`);

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
