import type { bson as BSON } from "@mongosh/service-provider-core";
import type { Database, ReplicaSet, Shard, ShellApi } from "@mongosh/shell-api";

export async function _evaluate(
	code: string,
	db: Database,
	rs: ReplicaSet,
	sh: Shard,
	{ sleep }: ShellApi,
	{ ObjectId, Int32, Long, Decimal128, Timestamp }: typeof BSON,
) {
	const result = await eval(code);
	return result;
}
