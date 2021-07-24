import { app, ipcMain } from "electron";

import Bootstrap from "./bootstrap";

import handleAction from './handle-action';

app.allowRendererProcessReuse = true;

app.whenReady().then(function () {
	try {
		Bootstrap();
	} catch (e) {
		console.error(e);
	}
});

ipcMain.handle('handleAll', (event, data: {library: string, action: string, args: Record<string, any>}) => {
	console.log(`Event: ${event} | data: ${data}`);
	//Handle All will be called for all the lib functions, we'll call an external function that'll call the specific lib function
	return handleAction(data.library, data.action, data.args);
})