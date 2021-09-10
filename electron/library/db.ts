import { getConnection } from "../stores/memory";

export const dbHelper = async (connectionId: string) => {
	try {
		const connection = getConnection(connectionId);

		if (connection) {
			const getDbName = async () => Promise.resolve(connection.options.dbName);

			return Promise.resolve({
				getDbName,
			});
		} else {
			return Promise.reject("Connection not found!");
		}
	} catch (e) {
		console.log(e);
		return Promise.reject(e.message || e);
	}
};
