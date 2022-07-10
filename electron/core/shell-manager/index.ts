
import * as bson from "bson";
import { nanoid } from "nanoid";
import { isObjectId } from "../../../util/misc";
import {
    CreateShell,
    DestroyShell,
    ExportData,
    InvokeJS,
    ShellEvalResult,
    StoredShellValue
} from "./types";
import { Driver } from "../driver";
import { getConnectionUri } from "../driver/connection/library";
import { MemoryStore } from "../stores/memory";
import { createEvaluator } from "./evaluator";
import { ERR_CODES } from "../../../util/errors";

interface CreateShellParams {
    driver: Driver;
    store: MemoryStore<StoredShellValue>
}

export function createShellManager(params: CreateShellParams) {
    const {
        store: shells,
        driver
    } = params;

    const manager = {
        create: async (data: CreateShell) => {
            const { contextDB, connectionId, encryptionKey } = data;

            const connection = driver.getConnection(connectionId);

            if (!connection) {
                throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
            } else if (connection && connection.server && !connection.server.listening) {
                throw new Error(ERR_CODES.CORE$DRIVER$SSH_TUNNEL_CLOSED);
            }

            const storedConnection = await driver.run({
                library: "connection",
                action: "load",
                args: { id: connectionId },
            });

            const connectionInfo = await driver.run({
                library: "connection",
                action: "info",
                args: { id: connectionId },
            });

            const uri = await getConnectionUri(storedConnection, encryptionKey);

            const mongoOptions = {
                ...storedConnection.options,
                replicaSet:
                    connectionInfo.replicaSetDetails &&
                        connectionInfo.replicaSetDetails.set
                        ? connectionInfo.replicaSetDetails.set
                        : undefined,
            };

            const shellExecutor = await createEvaluator({ uri, mongoOptions });

            const shell: StoredShellValue = {
                id: nanoid(),
                connectionId,
                database: contextDB,
                uri,
                evaluator: shellExecutor,
                validateDriver: () => {
                    const memEntry = driver.getConnection(connectionId);

                    if (!memEntry) {
                        throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
                    }

                    const { connection, server } = memEntry;

                    if (!connection) {
                        throw new Error(ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION);
                    } else if (server && !server.listening) {
                        throw new Error(ERR_CODES.CORE$DRIVER$SSH_TUNNEL_CLOSED);
                    }
                }
            };

            shells.save(shell.id, shell);

            console.log(`shell_create id=${shell.id} storedConnectionId=${connectionId} uri=${uri} db=${contextDB}`);

            return { id: shell.id };
        },
        eval: async (data: InvokeJS) => {
            const shell = shells.get(data.shell);

            if (!shell) throw new Error(ERR_CODES.CORE$SHELL$BROKEN_SHELL);

            shell.validateDriver();

            const evalResult = await shell.evaluator.evaluate(
                data.code,
                shell.database,
                {
                    page: data.page,
                    timeout: data.timeout,
                    limit: data.limit
                }
            );

            const result: ShellEvalResult = {
                ...evalResult,
                result: evalResult.isNotDocumentArray
                    ? Buffer.from(String(evalResult.result), "utf-8")
                    : bson.serialize(evalResult.result),
                editable: false
            };

            if (Array.isArray(evalResult.result)
                && evalResult.result.every(document =>
                    document._id && isObjectId(document._id)
                )
            ) {
                result.editable = true;
            }

            return result;
        },
        export: async (data: ExportData) => {
            const shell = shells.get(data.shell);

            if (!shell) throw new Error(ERR_CODES.CORE$SHELL$BROKEN_SHELL);

            shell.validateDriver();

            const result = await shell.evaluator.export(data.code, shell.database, data.options);

            return result;
        },
        destroy: async (data: DestroyShell) => {
            const shell = shells.get(data.shell);
            if (!shell) throw new Error(ERR_CODES.CORE$SHELL$BROKEN_SHELL);
            await shell.evaluator.disconnect();
            console.log(`shell destroy id=${shell.id} db=${shell.database}`);
            shells.drop(data.shell);
            return { id: data.shell };
        }
    };

    return manager;
}