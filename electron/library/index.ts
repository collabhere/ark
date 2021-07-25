import { connectionStore } from "../stores/connection";

export const indexHelper = async (connectionId: string) => {
	try {
		const connection = connectionStore().getConnection(connectionId);

		if (connection) {
			const getIndexDetails = async (collection: string) =>
				await connection.db().collection(collection).indexes();

			return Promise.resolve({
				getIndexDetails,
			});
		} else {
			return Promise.reject("Connection not found!");
		}
	} catch (e) {
		console.log(e);
		return Promise.reject(e.message || e);
	}
};
