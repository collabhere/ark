import type {
    Database,
    ShellApi,
    ReplicaSet,
    Shard,
} from "@mongosh/shell-api";
import type {
    bson as BSON
} from "@mongosh/service-provider-core";

export async function _evaluate(
    code: string,
    db: Database,
    rs: ReplicaSet,
    sh: Shard,
    { sleep }: ShellApi,
    { ObjectId, Int32, Long, Decimal128, Timestamp }: typeof BSON
) {
    const result = await eval(code);
    return result;
}
