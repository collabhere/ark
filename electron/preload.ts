const { contextBridge, ipcRenderer } = require("electron");

const invoke = (command: string, args: any) =>
	ipcRenderer
		.invoke(command, args)
		.then((result) => {
			if (result && result.err) {
				return Promise.reject(result.err);
			} else {
				return result;
			}
		});

const arkContext: Ark.Context = {
	shell: {
		create: (shellConfig, contextDB) =>
			invoke("shell_create", { shellConfig, contextDB }),
		eval: (shell: string, code: string) =>
			invoke("shell_eval", { code, shell }),
	},
	driver: {
		run: (library: string, action: string, args: any) => invoke('driver_run', {
			library,
			action,
			args,
		}),
	},
};

contextBridge.exposeInMainWorld("ark", arkContext);

export default {};
