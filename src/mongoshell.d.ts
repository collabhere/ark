import type { bson } from "@mongosh/service-provider-core";
import type { Database, ReplicaSet, Shard } from "@mongosh/shell-api";

declare global {
	export const db: Database;
	export const sh: Shard;
	export const rs: ReplicaSet;
	export const ObjectId: typeof bson.ObjectId;
	export const Int32: typeof bson.Int32;
	export const Long: typeof bson.Long;
	export const Decimal128: typeof bson.Decimal128;
	export const Timestamp: typeof bson.Timestamp;
	// ignore the error that this causes in intellisense. Monaco is configured to
	// not have default javascript types and instead we are adding types for
	// globals that are provided by mongosh.
	export const Date: typeof global.Date;
}
