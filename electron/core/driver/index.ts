import { Connection } from "./connection";
import { Database } from "./database";

export interface Driver {
    connection: Connection;
    database: Database;
}

export function createDriver(): Driver {
    return {
        connection: Connection,
        database: Database
    }
}

export type { Database };
export type { Connection };
