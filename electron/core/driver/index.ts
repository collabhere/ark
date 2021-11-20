import type { MemoryStore } from "../stores/memory";
import type { DiskStore } from "../stores/disk";
import type { MemEntry } from "../../modules/ipc";
import { Connection } from "./connection";
import { Database } from "./database";

export interface DriverModules {
    connection: Connection;
    database: Database;
}

export function createDriver(DriverDependency: Ark.DriverDependency) {
    const modules: DriverModules = {
        connection: Connection,
        database: Database
    };

    const driver: Ark.Driver = {
        run: async (type: keyof DriverModules, func: string, args = {}) => {
            const module: any = modules[type];

            if (!module) {
                throw new Error("Library (" + type + ") not found.");
            }

            const method = module[func];

            if (!method) {
                throw new Error("Method (" + func + ") not found.");
            }
            return method(DriverDependency, args);
        }
    };

    return driver;
}

export type { Database };
export type { Connection };
