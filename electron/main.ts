import { app, ipcMain } from "electron";

import Bootstrap from "./bootstrap";

app.allowRendererProcessReuse = true;

app.whenReady().then(function () {
	try {
		Bootstrap();

		ipcMain.on('api-ping', function () {
			console.log("Ping invoked!");
		});
	} catch (e) {
		console.error(e);
	}
});

