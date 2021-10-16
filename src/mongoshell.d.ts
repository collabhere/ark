import type { Database, ReplicaSet, Shard } from "@mongosh/shell-api";
import type {
    bson
} from "@mongosh/service-provider-core";

declare global {
    export const db: Database;
    export const sh: Shard;
    export const rs: ReplicaSet;
    export const ObjectId: typeof bson.ObjectId;
    export const Int32: typeof bson.Int32;
    export const Long: typeof bson.Long;
    export const Decimal128: typeof bson.Decimal128;
    export const Timestamp: typeof bson.Timestamp;
}
