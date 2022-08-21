import { BrowserWindow, session } from "electron";
import os from "os";
import path from "path";

export const enableDevTools = async (window: BrowserWindow, extensionPath: string): Promise<void> => {
	const reactDevToolsPath = path.join(os.homedir(), extensionPath);

	await session.defaultSession.loadExtension(reactDevToolsPath);
};
