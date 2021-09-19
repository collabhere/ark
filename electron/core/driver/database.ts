
import { CollectionInfo } from "mongodb";
import memory from "../stores/memory";

export interface Database {
    listCollections(arg: { id: string; database?: string; }): Promise<CollectionInfo[]>;
}

export const Database: Database = {
    listCollections: async ({ id, database }) => {
        const entry = memory.get(id);
        if (entry) {
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
