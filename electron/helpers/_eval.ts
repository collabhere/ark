import type {
    Database,
    ShellApi,
    ReplicaSet,
    Shard,
} from "@mongosh/shell-api";

export async function _evaluate(
    code: string,
    db: Database,
    rs: ReplicaSet,
    sh: Shard,
    shellApi: ShellApi
) {
    return await eval(code);
}
