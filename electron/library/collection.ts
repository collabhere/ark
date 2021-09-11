import { get } from "../stores/memory";

// interface collectionHelper {
// 	listCollections?: () => Promise<string[]>;
// 	renameCollection?: (
// 		collectionName: string,
// 		newName: string
// 	) => Promise<string>;
// 	dropCollection?: (name: string) => Promise<boolean>;
// 	error?: Promise<never>;
// }

// export const collectionHelper = (connectionId: string): collectionHelper => {
// 	try {
// 		const connection = getConnection(connectionId);

// 		if (connection) {
// 			const listCollections = async () =>
// 				(await connection.db().collections()).map(
// 					(coll) => coll.collectionName
// 				);

// 			const renameCollection = async (
// 				collectionName: string,
// 				newName: string
// 			) => await connection.db().renameCollection(collectionName, newName);

// 			const dropCollection = async (name: string) =>
// 				await connection.db().dropCollection(name);

// 			return {
// 				listCollections,
// 				renameCollection,
// 				dropCollection,
// 			};
// 		} else {
// 			return Promise.reject("Connection not found!");
// 		}
// 	} catch (e) {
// 		console.log(e);
// 		return Promise.reject(e.message || e);
// 	}
// };

// export function CollectionHelper(connectionId: string): collectionHelper {
// 	try {
// 		const connection = getConnection(connectionId);

// 		if (connection) {
// 			const listCollections = async () =>
// 				(await connection.db().collections()).map(
// 					(coll) => coll.collectionName
// 				);

// 			const renameCollection = async (
// 				collectionName: string,
// 				newName: string
// 			) =>
// 				await connection
// 					.db()
// 					.renameCollection(collectionName, newName)
// 					.then(() => "");

// 			const dropCollection = async (name: string) =>
// 				await connection.db().dropCollection(name);

// 			return {
// 				listCollections,
// 				renameCollection,
// 				dropCollection,
// 			};
// 		} else {
// 			console.log("Connection not found!");
// 			return {
// 				error: Promise.reject("Connection not found!"),
// 			};
// 		}
// 	} catch (e) {
// 		console.log(e);
// 		return {
// 			error: Promise.reject(e.message || e),
// 		};
// 		//return Promise.reject(e.message || e);
// 	}
// }

interface listCollectionParams {
	connectionId: string;
}

export async function listCollections(data: listCollectionParams) {
	console.log("list collections connection id: ", data.connectionId);
	const connectionId = data.connectionId;
	try {
		const connection = get(connectionId);

		if (connection) {
			return (await connection.db().collections()).map(
				(coll) => coll.collectionName
			);
		} else {
			return Promise.reject("Connection not found");
		}
	} catch (err) {
		console.log(err);
		return Promise.reject(err);
	}
}
