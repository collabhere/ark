import { session, BrowserWindow } from "electron";
import path from "path";
import os from "os";

export const enableDevTools = async (window: BrowserWindow, extensionPath: string): Promise<void> => {
	const reactDevToolsPath = path.join(os.homedir(), extensionPath);

	await session.defaultSession.loadExtension(reactDevToolsPath);
};
