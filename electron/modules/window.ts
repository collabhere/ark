import { BrowserWindowConstructorOptions, BrowserWindow } from "electron";

interface CreateWindowOptions { }
function createWindow(
	windowOptions?: BrowserWindowConstructorOptions,
	options?: CreateWindowOptions
) {
	const window = new BrowserWindow(windowOptions);
	window.removeMenu();
	return window;
}

export default {
	createWindow,
};
