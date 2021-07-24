import { contextBridge, ipcRenderer, ipcMain } from "electron";

contextBridge.exposeInMainWorld('ark', {
    api: {
        ping: () => {
            ipcRenderer.send("api-ping");
        }
    }
});
