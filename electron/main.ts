import { app, ipcMain } from "electron";

import Bootstrap from "./bootstrap";

app.allowRendererProcessReuse = true;

app.whenReady().then(function () {
	try {
		Bootstrap();
	} catch (e) {
		console.error(e);
	}
});

