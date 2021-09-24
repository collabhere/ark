import type { MemoryStore } from "../stores/memory";
import type { DiskStore } from "../stores/disk";
import type { MemEntry } from "../../modules/ipc";
import { Connection } from "./connection";
import { Database } from "./database";

interface CreateDriverParams {
    memoryStore: MemoryStore<MemEntry>;
    diskStore: DiskStore;
}

export interface DriverModules {
    connection: Connection;
    database: Database;
}

interface DriverCommands {
    run(type: keyof DriverModules, func: string, args: { id?: string;[k: string]: any; }): Promise<Ark.AnyObject>;
}

export function createDriver(params: CreateDriverParams): DriverCommands {
    const {
        diskStore,
        memoryStore
    } = params;

    const driver: DriverModules = {
        connection: Connection,
        database: Database
    };

    return {
        run: async (type, func, args = {}) => {
            const module: any = driver[type];

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
    }
}

export type { Database };
export type { Connection };
