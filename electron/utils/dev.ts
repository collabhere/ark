import { session } from "electron";
import path from "path";
import os from "os";


export const enableDevTools = async (extensionPath: string) => {
    const reactDevToolsPath = path.join(
        os.homedir(),
        extensionPath
    );

    await session.defaultSession.loadExtension(reactDevToolsPath);
}