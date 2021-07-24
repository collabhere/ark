import { BrowserWindowConstructorOptions, BrowserWindow } from "electron";

interface CreateWindowOptions { }
function createWindow(windowOptions?: BrowserWindowConstructorOptions, options?: CreateWindowOptions) {
    const window = new BrowserWindow(windowOptions);
    window.removeMenu();
    window.webContents.openDevTools();
    return window;
}

export default {
    createWindow
}