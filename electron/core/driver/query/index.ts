
import { deserialize } from "bson";
import { ERR_CODES } from "../../../../util/errors";

export interface Query {
    updateOne(dep: Ark.DriverDependency, arg: { id: string; database?: string; collection: string; query: Buffer; update: Buffer; }): Promise<{ ack: boolean; }>;
    updateMany(dep: Ark.DriverDependency, arg: { id: string; database?: string; collection: string; query: Buffer; update: Buffer; }): Promise<{ ack: boolean; }>;
    deleteOne(dep: Ark.DriverDependency, arg: { id: string; database?: string; collection: string; query: Buffer; }): Promise<{ ack: boolean; }>;
    deleteMany(dep: Ark.DriverDependency, arg: { id: string; database?: string; collection: string; query: Buffer; }): Promise<{ ack: boolean; }>;
}

export const Query: Query = {
    updateOne: async ({ memEntry }, { collection, database, query, update }) => {

        if (!memEntry) {
            throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
        }

        if (memEntry.server && !memEntry.server.listening) {
            throw new Error(ERR_CODES.CORE$DRIVER$SSH_TUNNEL_CLOSED);
        }

        const client = memEntry.connection;
        const db = client.db(database);

        const _query = deserialize(query);
        const _update = deserialize(update);

        const result = await db.collection(collection).updateOne(_query, _update);

        return {
            ack: result.acknowledged
        };
    },
    updateMany: async ({ memEntry }, { collection, database, query, update }) => {

        if (!memEntry) {
            throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
        }

        if (memEntry.server && !memEntry.server.listening) {
            throw new Error(ERR_CODES.CORE$DRIVER$SSH_TUNNEL_CLOSED);
        }

        const client = memEntry.connection;
        const db = client.db(database);

        const _query = deserialize(query);
        const _update = deserialize(update);

        const result = await db.collection(collection).updateMany(_query, _update);

        return {
            ack: result.acknowledged
        };
    },
    deleteOne: async ({ memEntry }, { collection, database, query }) => {

        if (!memEntry) {
            throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
        }

        if (memEntry.server && !memEntry.server.listening) {
            throw new Error(ERR_CODES.CORE$DRIVER$SSH_TUNNEL_CLOSED);
        }

        const client = memEntry.connection;
        const db = client.db(database);

        const _query = deserialize(query)

        const result = await db.collection(collection).deleteOne(_query);

        return {
            ack: result.acknowledged
        };
    },
    deleteMany: async ({ memEntry: memEntry }, { collection, database, query }) => {

        if (!memEntry) {
            throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
        }

        if (memEntry.server && !memEntry.server.listening) {
            throw new Error(ERR_CODES.CORE$DRIVER$SSH_TUNNEL_CLOSED);
        }

        const client = memEntry.connection;
        const db = client.db(database);

        const _query = deserialize(query)

        const result = await db.collection(collection).deleteMany(_query);

        return {
            ack: result.acknowledged
        };
    }
};
