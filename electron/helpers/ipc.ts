import { ipcMain } from "electron";

import * as CollectionLib from "../library/collection";

const Modules: Record<string, any> = {
    'collection': CollectionLib,
    'index': 'index file path',
}

function command(lib: string, func: string, args: Record<string, any>) {
    const library = Modules[lib];
    if (!library) {
        throw new Error("Library (" + lib + ") not found.");
    }
    const method = library[func];
    if (!method) {
        throw new Error("Method (" + func + ") not found.");
    }
    return method(args);
}

interface RunCommand {
    library: string;
    action: string;
    args: Record<string, any>;
}

export function registerProcessListeners() {
    ipcMain.handle('run_command', async (event, data: RunCommand) => {
        try {
            // console.log(`Event: ${event} | data: ${data}`);
            // run_command will be called for all the lib functions,
            // we'll call an external function that'll call the specific lib function
            return command(data.library, data.action, data.args);
        } catch (err) {
            console.error("`run_command` error");
            console.error(err);
            return { err };
        }
    });
}
