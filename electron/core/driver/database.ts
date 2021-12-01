
import { CollectionInfo } from "mongodb";
export interface Database {
    listCollections(dep: Ark.DriverDependency, arg: { id: string; database?: string; }): Promise<CollectionInfo[]>;
}

export const Database: Database = {
    listCollections: async (
        { memoryStore },
        { id, database }
    ) => {
        const entry = memoryStore.get(id);
        if (entry) {

            if (entry.server && !entry.server.listening) {
                throw new Error("SSH tunnel closed! Unable to process request.");
            }

            const client = entry.connection;
            const db = client.db(database);
            const cursor = await db.listCollections({}, { nameOnly: false, dbName: database });
            const collections = await cursor.toArray();
            return collections;
        } else {
            throw new Error("Entry not found");
        }
    }
};
