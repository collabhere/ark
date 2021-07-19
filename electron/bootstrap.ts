import path from "path";
import { URL } from "url";

import Window from "./window";

async function boot() {
    const window = Window.createWindow(
        {
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true
            },
        }
    );

    const loadURL = process.env.ARK_ENTRY_URL || `file://${path.join(__dirname, "../dist/index.html")}`;

    window.loadURL(loadURL);
}

export default {
    boot
}