import { connectionStore } from "../stores/connection";

export const adminHelper = async (connectionId: string) => {
	try {
		const connection = connectionStore().getConnection(connectionId);

		if (connection) {
			const getReplicaSets = async () =>
				await connection.db().admin().replSetGetStatus();

			return Promise.resolve({
				getReplicaSets,
			});
		} else {
			return Promise.reject("Connection not found!");
		}
	} catch (e) {
		console.log(e);
		return Promise.reject(e.message || e);
	}
};
