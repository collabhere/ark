const { contextBridge, ipcRenderer, clipboard } = require("electron");

const invoke = (command: string, args?: any) =>
	ipcRenderer.invoke(command, args).then((result) => {
		if (result && result.err) {
			return Promise.reject(result.err);
		} else {
			return result;
		}
	});

const arkContext: Ark.Context = {
	browseForFile: (title, buttonLabel) => invoke("browse_fs", { type: "file", title, buttonLabel }),
	browseForDirs: (title, buttonLabel) => invoke("browse_fs", { type: "dir", title, buttonLabel }),
	copyText: (text) => clipboard.writeText(text),
	titlebar: {
		close: () => { 
			invoke("title_actions", { action: "close" })
		},
		minimize: () => invoke("title_actions", { action: "minimize" }),
		maximize: () => invoke("title_actions", { action: "maximize" })
	},
	scripts: {
		open: (params) => invoke("script_actions", { action: "open", params }),
		save: (params) => invoke("script_actions", { action: "save", params }),
		saveAs: (params) => invoke("script_actions", { action: "save_as", params }),
		delete: (scriptId) => invoke("script_actions", { action: "delete", params: { scriptId } })
	},
	shell: {
		create: (uri, contextDB, storedConnectionId) =>
			invoke("shell_create", { uri, contextDB, storedConnectionId }),
		eval: (shell, code, connectionId, options) =>
			invoke("shell_eval", { code, shell, connectionId, ...options}),
		export: (shell, code, connectionId, options) =>
			invoke("shell_export", { code, shell, connectionId, options }),
		destroy: (shell) => invoke("shell_destroy", { shell }),
	},
	driver: {
		run: (library: string, action: string, args: any) =>
			invoke("driver_run", {
				library,
				action,
				args,
			}),
	},
	settings: {
		save: (type, settings) =>
			invoke("settings_actions", { action: "save", type, settings }),
		fetch: (type) => invoke("settings_actions", { action: "fetch", type }),
	},
};

contextBridge.exposeInMainWorld("ark", arkContext);

export default {};
