import { get } from "../stores/memory";

export const adminHelper = async (connectionId: string) => {
	try {
		const connection = get(connectionId);

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
