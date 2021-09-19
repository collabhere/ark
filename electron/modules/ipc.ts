import { ipcMain } from "electron";
import { nanoid } from "nanoid";
import * as bson from "bson";

import { createEvaluator, Evaluator } from "../core/evaluator";
import { createDriver, Driver } from "../core/driver";

function command(type: keyof Driver, func: string, args: any) {
	const driver = createDriver();
	const library: any = driver[type];
	if (!library) {
		throw new Error("Library (" + type + ") not found.");
	}
	let method = library[func];
	if (!method) {
		throw new Error("Method (" + func + ") not found.");
	}
	return method(args);
}

interface RunCommandInput {
	library: keyof Driver;
	action: string;
	args: Record<string, any>;
}

interface InvokeJS {
	code: string;
	shell: string;
}

interface CreateShell {
	shellConfig: Ark.ShellProps;
	contextDB: string;
}
interface StoredShellValue {
	id: string;
	executor: Evaluator;
	database: string;
}

function IPC() {
	const shells = new Map<string, StoredShellValue>();

	return {
		init: () => {
			ipcMain.handle("run_command", async (event, data: RunCommandInput) => {
				try {
					console.log(`calling ${data.library}.${data.action}()`);
					const result = await command(data.library, data.action, data.args);
					return result;
				} catch (err) {
					console.error("`run_command` error");
					console.error(err);
					return { err };
				}
			});

			ipcMain.handle("create_shell", async (event, data: CreateShell) => {
				try {
					const { shellConfig, contextDB } = data;
					const shellExecutor = await createEvaluator({
						database: shellConfig.database,
						uri: shellConfig.uri,
					});
					const shell = {
						id: nanoid(),
						executor: shellExecutor,
						database: contextDB
					};
					shells.set(shell.id, shell);
					return { id: shell.id };
				} catch (err) {
					console.error("`create_shell` error");
					console.error(err);
					return { err };
				}
			});

			ipcMain.handle("invoke_js", async (event, data: InvokeJS) => {
				try {
					const shell = shells.get(data.shell);
					if (!shell) throw new Error("Invalid shell");
					const result = await shell.executor.evaluate(data.code, shell.database);
					return { result: bson.serialize(result.result) };
				} catch (err) {
					console.error("`invoke_js` error");
					console.error(err);
					return { err };
				}
			});
		}
	}
}

export default IPC();
