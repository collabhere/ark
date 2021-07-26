import electronStorage from "electron-json-storage";
import os from "os";

export const diskStore = (dirName: string = "ark") => {
	const defaultPath = os.homedir();
	electronStorage.setDataPath(`${defaultPath}/${dirName}`);

	const promisify = (func: any, ...args: any) => {
		return new Promise((resolve, reject) => {
			func.bind(electronStorage)(...args, (err: any, data: any) => {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	};

	/**
	 * Usage example:
	 *  set('connections', 'testConnection', { value: 'test'});
	 *  => Should create a testConnection.json file in ~/ark/connections dir;
	 */
	const set = (module: string, key: string, value: Record<string, any>) => {
		return promisify(electronStorage.set, key, value, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		});
	};

	/**
	 * Usage example:
	 *  get('connections', 'testConnection');
	 *  => Should return { value: 'test'};
	 */
	const get = (module: string, key: string) => {
		return promisify(electronStorage.get, key, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		});
	};

	/**
	 * Usage example:
	 *  get('connections', 'testConnection');
	 *  => Should remove testConnection.json file from ~/ark/connections dir;
	 */
	const remove = (module: string, key: string) => {
		return promisify(electronStorage.remove, key, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		});
	};

	const has = (module: string, key: string) => {
		return promisify(electronStorage.has, key, {
			dataPath: `${electronStorage.getDataPath()}/${module}`,
		});
	};

	return { get, set, remove, has };
};
