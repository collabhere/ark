import type { BrowserWindow } from "electron";
import { ipcMain, dialog } from "electron";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

import { createDriver, RunCommandInput } from "../../core/driver";
import { createShellManager } from "../../core/shell-manager";
import { createMemoryStore } from "../../core/stores/memory";
import { createDiskStore } from "../../core/stores/disk";
import { UploadFile } from "antd/lib/upload/interface";
import { ipcHandlers } from "./handler";

import type {
	CreateShell,
	DestroyShell,
	ExportData,
	InvokeJS,
	StoredShellValue,
} from "../../core/shell-manager/types";

import type {
	BrowseFS,
	MemEntry,
	ScriptActionData,
	SettingsAction,
	StoredScript,
	TitlebarActions
} from "./types";
import { ERR_CODES } from "../../../util/errors";

interface IPCInitParams {
	window: BrowserWindow;
}

function IPC() {

	const driver = createDriver({
		memoryStore: createMemoryStore<MemEntry>(),
		diskStore: createDiskStore<Ark.StoredConnection>("connections"),
		iconStore: createDiskStore<UploadFile<Blob>>("icons"),
	});

	const shellManager = createShellManager({
		driver,
		store: createMemoryStore<StoredShellValue>()
	});

	// Stores opened scripts
	const scriptDiskStore = createDiskStore<StoredScript>("scripts");
	const settingsStore = createDiskStore<Ark.Settings>("settings");

	return {
		init: ({ window }: IPCInitParams) => {
			ipcMain.handle(
				...ipcHandlers<RunCommandInput>({
					channel: "driver_run",
					controller: driver.run,
					onEventLog: (data) => `calling ${data.library}.${data.action}() ${data.args ? `args=${JSON.stringify(data.args).slice(0, 100)}` : ``}`
				})
			);

			ipcMain.handle(
				...ipcHandlers<CreateShell>({
					channel: "shell_create",
					controller: shellManager.create
				})
			);

			ipcMain.handle(
				...ipcHandlers<InvokeJS>({
					channel: "shell_eval",
					controller: shellManager.eval
				})
			);

			ipcMain.handle(
				...ipcHandlers<ExportData>({
					channel: "shell_export",
					controller: shellManager.export
				})
			);

			ipcMain.handle(
				...ipcHandlers<DestroyShell>({
					channel: "shell_destroy",
					controller: shellManager.destroy
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
								throw new Error(ERR_CODES.SCRIPTS$OPEN$INVALID_INPUT);
							}

						} else if (data.action === "save") {
							const { code, id } = data.params;

							const storedScript = await scriptDiskStore.get(id);

							if (!storedScript) {
								throw new Error(ERR_CODES.SCRIPTS$SAVE$NO_ENT);
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
