import type { BrowserWindow } from "electron";
import { ipcMain, dialog, app } from "electron";
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
import { UploadFile } from "antd/lib/upload/interface";
import { isObjectId } from "../../util/misc";
import { IpcMainInvokeEvent } from "electron/main";
import { getConnectionUri } from "../core/driver/connection";

export interface ShellEvalResult {
	editable: boolean;
	result: Buffer;
	err?: Error;
}

interface RunCommandInput {
	library: keyof DriverModules;
	action: string;
	args: Record<string, any> & { id: string };
}

interface InvokeJS {
	code: string;
	shell: string;
	connectionId: string;
	page: number;
	limit: number;
	timeout?: number;
}

interface ExportData extends InvokeJS {
	options: Ark.ExportCsvOptions | Ark.ExportNdjsonOptions;
}

interface CreateShell {
	contextDB: string;
	connectionId: string;
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

export interface TitlebarActions {
	action: "close" | "maximize" | "minimize"
}

export type ScriptActionData =
	| ScriptOpenActionData
	| ScriptSaveActionData
	| ScriptSaveAsActionData
	| ScriptDeleteActionData;

export interface MemEntry {
	connection: MongoClient;
	databases: ListDatabasesResult["databases"];
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

export interface SettingsAction {
	action: 'save' | 'fetch';
	type: 'general';
	settings: Ark.Settings;
}

interface IPCHandle {
	(event: IpcMainInvokeEvent, data: any): Promise<any>;
}

interface IPCHandlerOptions<ArgType, ReturnType> {
	channel: string;
	controller: (args: ArgType) => Promise<ReturnType>;
	onEventLog?: (args: ArgType) => string;
}

function ipcHandlers<ArgType, ReturnType = any>({
	channel,
	controller,
	onEventLog,
}: IPCHandlerOptions<ArgType, ReturnType>): [string, IPCHandle] {

	const handle: IPCHandle = async (event, data) => {

		console.log(`[${channel}] ${onEventLog ? onEventLog(data) : `data=${JSON.stringify(data).slice(0, 256)}`}`)

		try {
			const result = await controller(data);
			return result;
		} catch (err) {
			console.log(err);
			return { err };
		}
	}

	return [channel, handle];
}

function IPC() {
	const shells = createMemoryStore<StoredShellValue>();

	const DriverDependency: Ark.DriverDependency = {
		diskStore: createDiskStore<Ark.StoredConnection>("connections"),
		memoryStore: createMemoryStore<MemEntry>(),
		iconStore: createDiskStore<UploadFile<Blob>>("icons"),
	};

	const driver = createDriver(DriverDependency);

	// Stores opened scripts
	const scriptDiskStore = createDiskStore<StoredScript>("scripts");
	const settingsStore = createDiskStore<Ark.Settings>("settings");

	return {
		init: ({ window }: IPCInitParams) => {
			ipcMain.handle(
				...ipcHandlers<RunCommandInput>({
					channel: "driver_run",
					controller: async (data) => {
						return driver.run(data.library as any, data.action as any, data.args);
					},
					onEventLog: (data) => `calling ${data.library}.${data.action}() ${data.args ? `args=${JSON.stringify(data.args).slice(0, 100)}` : ``}`
				})
			);

			ipcMain.handle(
				...ipcHandlers<CreateShell>({
					channel: "shell_create",
					controller: async (data) => {
						const { contextDB, connectionId } = data;

						const storedConnection = await driver.run("connection", "load", { id: connectionId });
						const driverConnection = await driver.run("connection", "info", { id: connectionId });

						const uri = getConnectionUri(storedConnection);

						const mongoOptions = {
							...storedConnection.options,
							replicaSet:
								driverConnection.replicaSetDetails &&
									driverConnection.replicaSetDetails.set
									? driverConnection.replicaSetDetails.set
									: undefined,
						};

						const shellExecutor = await createEvaluator({ uri, mongoOptions }, DriverDependency);
						const shell = {
							id: nanoid(),
							executor: shellExecutor,
							database: contextDB,
							uri
						};
						shells.save(shell.id, shell);
						console.log(`shell_create id=${shell.id} storedConnectionId=${connectionId} uri=${uri} db=${contextDB}`);
						return { id: shell.id };
					}
				})
			);

			ipcMain.handle(
				...ipcHandlers<InvokeJS>({
					channel: "shell_eval",
					controller: async (data) => {
						const shell = shells.get(data.shell);
						if (!shell) throw new Error("Invalid shell");
						const evalResult = await shell.executor.evaluate(
							data.code,
							shell.database,
							data.connectionId,
							{
								page: data.page,
								timeout: data.timeout,
								limit: data.limit
							}
						);

						const result: ShellEvalResult = {
							result: bson.serialize(evalResult),
							editable: false
						};

						if (Array.isArray(evalResult)
							&& evalResult.every(document =>
								document._id && isObjectId(document._id)
							)
						) {
							result.editable = true;
						}

						return result;
					}
				})
			);

			ipcMain.handle(
				...ipcHandlers<ExportData>({
					channel: "shell_export",
					controller: async (data) => {
						const shell = shells.get(data.shell);
						if (!shell) throw new Error("Invalid shell");
						await shell.executor.export(data.code, shell.database, data.connectionId, data.options);
						return;
					}
				})
			);

			ipcMain.handle(
				...ipcHandlers<DestroyShell>({
					channel: "shell_destroy",
					controller: async (data) => {
						const shell = shells.get(data.shell);
						if (!shell) throw new Error("No shell to destroy");
						await shell.executor.disconnect();
						console.log(`shell destroy id=${shell.id} db=${shell.database}`);
						shells.drop(data.shell);
						return { id: data.shell };

					}
				})
			);

			ipcMain.handle(
				...ipcHandlers<BrowseFS>({
					channel: "browse_fs",
					controller: async (data) => {
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

					}
				})
			);

			ipcMain.handle(
				...ipcHandlers<ScriptActionData>({
					channel: "script_actions",
					controller: async (data) => {
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

							await fs.promises.writeFile(fullpath, code || '');

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

							await fs.promises.writeFile(fullpath, code || '');


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
					}
				})
			);

			ipcMain.handle(
				...ipcHandlers<SettingsAction>({
					channel: "settings_actions",
					controller: async (data) => {
						if (data.action === 'save') {
							const { settings } = data;
							await settingsStore.set(data.type, settings);
						} else if (data.action === 'fetch') {
							return await settingsStore.get(data.type);
						}
					}
				})
			);

			ipcMain.handle(
				...ipcHandlers<TitlebarActions>({
					channel: "title_actions",
					controller: async (data) => {
						if (data.action === 'close') {
							window.close();
						} else if (data.action === "maximize") {
							if (window.isMaximized()) {
								window.unmaximize()
							} else {
								window.maximize();
							}
						} else if (data.action === "minimize") {
							window.minimize();
						}
					}
				})
			);
		}
	}
}

export default IPC();
