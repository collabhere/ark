import type { MemoryStore } from "../stores/memory";
import type { DiskStore } from "../stores/disk";
import type { MemEntry } from "../../modules/ipc";
import { Connection } from "./connection";
import { Database } from "./database";

interface CreateDriverParams {
    memoryStore: MemoryStore<MemEntry>;
    diskStore: DiskStore<Ark.StoredConnection>;
}

export interface DriverModules {
    connection: Connection;
    database: Database;
}

export function createDriver(params: CreateDriverParams) {
    const {
        diskStore,
        memoryStore
    } = params;

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

            const DriverDependency: Ark.DriverDependency = {
                diskStore,
                memoryStore
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
