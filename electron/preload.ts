const { contextBridge, ipcRenderer } = require("electron");

const invoke = (command: string, args: any) =>
	ipcRenderer.invoke(command, args).then((result) => {
		if (result && result.err) {
			return Promise.reject(result.err);
		} else {
			return result;
		}
	});

const arkContext: Ark.Context = {
	shell: {
		create: (uri, contextDB, driverConnectionId) =>
			invoke("shell_create", { uri, contextDB, driverConnectionId }),
		eval: (shell, code) => invoke("shell_eval", { code, shell }),
		export: (shell, code, options) =>
			invoke("shell_export", { code, shell, options }),
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
};

contextBridge.exposeInMainWorld("ark", arkContext);

export default {};
