import path from "path";

import Window from "./window";

export default async function boot() {
    const window = Window.createWindow(
        {
            width: 1400,
            height: 900,
            frame: false,
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, 'preload')
            },
        }
    );

    const loadURL = process.env.ARK_ENTRY_URL || `file://${path.join(__dirname, "../index.html")}`;

    await window.loadURL(loadURL);
}
