import { Database, ReplicaSet, Shard } from "@mongosh/shell-api";

declare global {
    export const db: Database;
    export const sh: Shard;
    export const rs: ReplicaSet;
}
