import { ipcMain } from "electron";
import { nanoid } from "nanoid";

import * as CollectionLib from "../library/collection";
import * as ConnectionLib from "../library/connection";
import { createEvaluator, Evaluator } from "./mongo-eval";

const Modules: Record<string, any> = {
	collection: CollectionLib,
	connection: ConnectionLib,
};

function command(lib: string, func: string, args: Record<string, any>) {
	const library = Modules[lib];
	if (!library) {
		throw new Error("Library (" + lib + ") not found.");
	}
	const method = library[func];
	if (!method) {
		throw new Error("Method (" + func + ") not found.");
	}
	return method(args);
}

interface RunCommand {
	library: string;
	action: string;
	args: Record<string, any>;
}

interface InvokeJS {
	code: string;
	shell: string;
}

interface CreateShell {
	shellConfig: {
		uri: string;
	};
}

interface StoredShellValue {
	id: string;
	executor: Evaluator;
}

export function IPCHandler() {
	const shells = new Map<string, StoredShellValue>();

	ipcMain.handle("run_command", async (event, data: RunCommand) => {
		try {
			// run_command will be called for all the lib functions,
			// we'll call an external function that'll call the specific lib function
			return command(data.library, data.action, data.args);
		} catch (err) {
			console.error("`run_command` error");
			console.error(err);
			return { err };
		}
	});

	ipcMain.handle("create_shell", async (event, data: CreateShell) => {
		try {
			const shellExecutor = await createEvaluator({
				database: '',
				uri: data.shellConfig.uri
			});
			const shell = {
				id: nanoid(),
				executor: shellExecutor,
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
			const shellExecutor = shells.get(data.shell);
			if (!shellExecutor) throw new Error("Invalid shell");
			const result = await shellExecutor.executor.evaluate(data.code);
			return { result };
		} catch (err) {
			console.error("`invoke_js` error");
			console.error(err);
			return { err };
		}
	});
}
