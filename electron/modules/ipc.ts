import type { BrowserWindow } from "electron";
import { ipcMain, dialog } from "electron";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import * as bson from "bson";

import { createEvaluator, Evaluator } from "../core/evaluator";
import { createDriver, DriverModules } from "../core/driver";
import { createMemoryStore } from "../core/stores/memory";
import { createDiskStore } from "../core/stores/disk";
import { MongoClient, ListDatabasesResult } from "mongodb";
import { Server } from "net";

interface RunCommandInput {
	library: keyof DriverModules;
	action: string;
	args: Record<string, any> & { id: string };
}

interface InvokeJS {
	code: string;
	shell: string;
	connectionId: string;
}

interface ExportData extends InvokeJS {
	options: Ark.ExportCsvOptions | Ark.ExportNdjsonOptions;
}

interface CreateShell {
	uri: string;
	contextDB: string;
	storedConnectionId: string;
}

interface DestroyShell {
	shell: string;
}

interface BrowseFS {
	type: "dir" | "file";
	title?: string;
	buttonLabel?: string;
}

export interface StoredScript {
	id: string;
	fullpath: string;
	fileName?: string;
	storedConnectionId?: string;
}

export interface ScriptSaveParams {
	id: string;
	code?: string;
}

export interface ScriptSaveActionData {
	action: "save";
	params: ScriptSaveParams;
}

export interface ScriptSaveAsActionData {
	action: "save_as";
	params: {
		saveLocation?: string;
		storedConnectionId?: string;
		fileName?: string;
		code?: string;
	} & Omit<ScriptSaveParams, "id">;
}

export interface ScriptDeleteActionData {
	action: "delete";
	params: { scriptId: string; };
}

export interface ScriptOpenActionData {
	action: "open";
	params: { storedConnectionId?: string; fileLocation?: string; };
}

export type ScriptActionData =
	| ScriptOpenActionData
	| ScriptSaveActionData
	| ScriptSaveAsActionData
	| ScriptDeleteActionData;

export interface MemEntry {
	connection: MongoClient;
	databases: ListDatabasesResult;
	server?: Server;
}
interface StoredShellValue {
	id: string;
	uri: string;
	executor: Evaluator;
	database: string;
}

interface IPCInitParams {
	window: BrowserWindow;
}

function IPC() {
	const shells = createMemoryStore<StoredShellValue>();

	const connectionStore = createMemoryStore<MemEntry>();
	const driver = createDriver({
		memoryStore: connectionStore,
		diskStore: createDiskStore<Ark.StoredConnection>("connections"),
	});

	// Stores opened scripts
	const scriptDiskStore = createDiskStore<StoredScript>("scripts");

	return {
		init: ({ window }: IPCInitParams) => {
			ipcMain.handle("driver_run", async (event, data: RunCommandInput) => {
				try {
					console.log(`calling ${data.library}.${data.action}()`);
					const result = await driver.run(data.library as any, data.action as any, data.args)
					return result;
				} catch (err) {
					console.error("`driver_run` error");
					console.error(err);
					return { err };
				}
			});

			ipcMain.handle("shell_create", async (event, data: CreateShell) => {
				try {
					const { uri, contextDB, storedConnectionId } = data;

					const storedConnection = await driver.run("connection", "load", { id: storedConnectionId });
					const driverConnection = await driver.run("connection", "info", { id: storedConnectionId });
					const mongoOptions = {
						...storedConnection.options,
						replicaSet:
							driverConnection.replicaSetDetails &&
							driverConnection.replicaSetDetails.set
								? driverConnection.replicaSetDetails.set
								: undefined,
					};
					const shellExecutor = await createEvaluator({
						uri,
						mongoOptions,
						connectionStore,
					});
					const shell = {
						id: nanoid(),
						executor: shellExecutor,
						database: contextDB,
						uri
					};
					shells.save(shell.id, shell);
					console.log(`created shell id=${shell.id} storedConnectionId=${storedConnectionId} uri=${uri} db=${contextDB}`);
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
						shell.database,
						data.connectionId
					);
					return { result: bson.serialize(result) };
				} catch (err) {
					console.error("`shell_eval` error");
					console.error(err);
					return { err };
				}
			});

			ipcMain.handle("shell_export", async (event, data: ExportData) => {
				try {
					const shell = shells.get(data.shell);
					if (!shell) throw new Error("Invalid shell");
					await shell.executor.export(data.code, shell.database, data.connectionId, data.options);
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
					console.log(`shell destroy id=${shell.id} db=${shell.database}`);
					shells.drop(data.shell);
					return { id: data.shell };
				} catch (err) {
					console.error("`shell_destroy` error");
					console.error(err);
					return { err };
				}
			});

			ipcMain.handle("browse_fs", async (event, data: BrowseFS) => {
				const { buttonLabel, title, type } = data;
				if (type === "dir") {
					const result = await dialog.showOpenDialog(window, {
						title,
						buttonLabel,
						properties: ["openDirectory"]
					});
					return {
						dirs: result.filePaths
					};
				} else if (type === "file") {
					const result = await dialog.showOpenDialog(window, {
						title,
						buttonLabel,
						properties: ["openFile"]
					});
					return {
						path: result.filePaths[0]
					};
				}
			});

			ipcMain.handle("script_actions", async (event, data: ScriptActionData) => {
				try {
					if (data.action === 'open') {
						const { fileLocation, storedConnectionId } = data.params;

						if (fileLocation && storedConnectionId) {
							const [fileName] = fileLocation.match(/(?<=\/)[ \w-]+?(\.)js/i) || [];
							const code = (await fs.promises.readFile(fileLocation)).toString();

							const id = nanoid();

							const script: StoredScript = {
								id,
								storedConnectionId,
								fullpath: fileLocation,
								fileName
							};

							await scriptDiskStore.set(id, script);

							return {
								code,
								script
							};
						} else {
							throw new Error("Invalid input to open");
						}

					} else if (data.action === "save") {
						const { code, id } = data.params;

						const storedScript = await scriptDiskStore.get(id);

						if (!storedScript) {
							throw new Error("Script does not exist.");
						}

						const { fullpath } = storedScript;

						await fs.promises.writeFile(fullpath, code);

						return storedScript;
					} else if (data.action === "save_as") {

						const { code, saveLocation, storedConnectionId, fileName } = data.params;

						const fullpath = path.join(
							saveLocation
								? saveLocation
								: '',
							fileName
								? fileName
								: 'untitled-ark-script.js'
						);

						await fs.promises.writeFile(fullpath, code);


						const id = nanoid();

						const script: StoredScript = {
							id,
							storedConnectionId,
							fullpath,
							fileName
						};

						await scriptDiskStore.set(id, script);

						return script;
					} else if (data.action === "delete") {
						const { scriptId } = data.params;
					}
				} catch (err) {
					console.error("`script_actions` error");
					console.error(err);
					return { err };
				}
			});
		}
	}
}

export default IPC();
