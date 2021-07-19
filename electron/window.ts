import { BrowserWindowConstructorOptions, BrowserWindow } from "electron";

interface CreateWindowOptions { }
function createWindow(windowOptions?: BrowserWindowConstructorOptions, options?: CreateWindowOptions) {
    const window = new BrowserWindow(windowOptions);
    return window;
}

export default {
    createWindow
}