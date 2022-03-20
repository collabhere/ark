
import { deserialize } from "bson";

export interface Query {
    updateOne(dep: Ark.DriverDependency, arg: { id: string; database: string; collection: string; query: Buffer; update: Buffer; }): Promise<{ ack: boolean; }>;
}

export const Query: Query = {
    updateOne: async ({ memoryStore }, { collection, database, id, query, update }) => {
        const entry = memoryStore.get(id);
        if (entry) {

            if (entry.server && !entry.server.listening) {
                throw new Error("SSH tunnel closed! Unable to process request.");
            }

            const client = entry.connection;
            const db = client.db(database);

            const _query = deserialize(query);
            const _update = deserialize(update);

            const result = await db.collection(collection).updateOne(_query, _update);

            return {
                ack: result.acknowledged
            };
        } else {
            throw new Error("Entry not found");
        }
    }
};
