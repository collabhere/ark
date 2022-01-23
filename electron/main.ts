import { app, protocol } from "electron";
import path from "path";

import Window from "./modules/window";
import IPC from "./modules/ipc";

import { enableDevTools } from "./utils/dev";
import { ARK_FOLDER_PATH } from "./utils/constants";

(async function main() {
	try {
		app.allowRendererProcessReuse = true;

		await app.whenReady();

		protocol.registerFileProtocol("ark", (request, callback) => {
			console.log(request.url);
			const url = request.url.slice(5);
			callback({ path: `${ARK_FOLDER_PATH}${url}` });
		});

		const window = Window.createWindow({
			width: 1400,
			height: 900,
			frame: false,
			webPreferences: {
				preload: path.join(__dirname, "preload")
			},
		});

		IPC.init({
			window,
		});

		if (process.env.ARK_ENABLE_DEV_TOOLS && process.env.ARK_DEV_TOOLS_PATH)
			await enableDevTools(process.env.ARK_DEV_TOOLS_PATH);

		const loadURL =
			process.env.ARK_ENTRY_URL ||
			`file://${path.join(__dirname, "../index.html")}`;

		await window.loadURL(loadURL);
	} catch (e) {
		console.error(e);
	}
})();
