import { ipcMain } from "electron";
import { nanoid } from "nanoid";
import * as bson from "bson";

import { createEvaluator, Evaluator } from "../core/evaluator";
import { createDriver, DriverModules } from "../core/driver";
import { createMemoryStore } from "../core/stores/memory";
import { createDiskStore } from "../core/stores/disk";
import { MongoClient, ListDatabasesResult } from "mongodb";

interface RunCommandInput {
	library: keyof DriverModules;
	action: string;
	args: Record<string, any> & { id: string };
}

interface InvokeJS {
	code: string;
	shell: string;
}

interface CreateShell {
	uri: string;
	contextDB: string;
}

interface DestroyShell {
	shell: string;
}

export interface MemEntry {
	connection: MongoClient;
	databases: ListDatabasesResult;
}
interface StoredShellValue {
	id: string;
	executor: Evaluator;
	database: string;
}

function IPC() {
	const shells = createMemoryStore<StoredShellValue>();

	const driver = createDriver({
		memoryStore: createMemoryStore<MemEntry>(),
		diskStore: createDiskStore(),
	});

	return {
		init: () => {
			ipcMain.handle("driver_run", async (event, data: RunCommandInput) => {
				try {
					console.log(`calling ${data.library}.${data.action}()`);
					const result = await driver.run(data.library, data.action, data.args);
					return result;
				} catch (err) {
					console.error("`driver_run` error");
					console.error(err);
					return { err };
				}
			});

			ipcMain.handle("shell_create", async (event, data: CreateShell) => {
				try {
					const { uri, contextDB } = data;
					console.log("Create shell data", data);
					const shellExecutor = await createEvaluator({
						uri,
					});
					const shell = {
						id: nanoid(),
						executor: shellExecutor,
						database: contextDB,
					};
					shells.save(shell.id, shell);
					return { id: shell.id };
				} catch (err) {
					console.error("`shell_create` error");
					console.error(err);
					return { err };
				}
			});

			ipcMain.handle("shell_eval", async (event, data: InvokeJS) => {
				try {
					const shell = shells.get(data.shell);
					if (!shell) throw new Error("Invalid shell");
					const result = await shell.executor.evaluate(
						data.code,
						shell.database
					);
					return { result: bson.serialize(result) };
				} catch (err) {
					console.error("`shell_eval` error");
					console.error(err);
					return { err };
				}
			});

			ipcMain.handle("shell_export", async (event, data: InvokeJS) => {
				try {
					const shell = shells.get(data.shell);
					if (!shell) throw new Error("Invalid shell");
					await shell.executor.export(data.code, shell.database);
					return;
				} catch (err) {
					console.error("`shell_export` error");
					console.error(err);
					return Promise.reject(err);
				}
			});

			ipcMain.handle("shell_destroy", async (event, data: DestroyShell) => {
				try {
					const shell = shells.get(data.shell);
					if (!shell) throw new Error("No shell to destroy");
					await shell.executor.disconnect();
					shells.drop(data.shell);
					return { id: data.shell };
				} catch (err) {
					console.error("`shell_destroy` error");
					console.error(err);
					return { err };
				}
			});
		},
	};
}

export default IPC();
