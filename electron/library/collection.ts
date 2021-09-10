import { getConnection } from "../stores/memory";

export const collectionHelper = async (connectionId: string) => {
	try {
		const connection = getConnection(connectionId);

		if (connection) {
			const getCollections = async () =>
				(await connection.db().collections()).map(
					(coll) => coll.collectionName
				);

			const renameCollection = async (
				collectionName: string,
				newName: string
			) => await connection.db().renameCollection(collectionName, newName);

			const dropCollection = async (name: string) =>
				await connection.db().dropCollection(name);

			return Promise.resolve({
				getCollections,
				renameCollection,
				dropCollection,
			});
		} else {
			return Promise.reject("Connection not found!");
		}
	} catch (e) {
		console.log(e);
		return Promise.reject(e.message || e);
	}
};
