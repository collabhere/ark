import { MemEntry } from "../../modules/ipc/types";
import { Connection } from "./connection";
import { Database } from "./database";
import { Query } from "./query";

export interface RunCommandInput {
	library: keyof DriverModules;
	action: string;
	args: Record<string, any> & { id: string };
}

export interface Driver {
	getConnection(connectionId: string): MemEntry | undefined;
	run(input: RunCommandInput): Promise<any>;
}

export interface DriverModules {
	connection: Connection;
	database: Database;
	query: Query;
}

export function createDriver(stores: Ark.DriverStores) {
	const modules: DriverModules = {
		connection: Connection,
		database: Database,
		query: Query,
	};

	const { memoryStore, diskStore, iconStore } = stores;

	const driver: Driver = {
		getConnection: (connectionId: string) =>
			memoryStore.has(connectionId) ? memoryStore.get(connectionId) : undefined,
		run: async (input) => {
			const { library, action, args } = input;

			const module: any = modules[library];

			if (!module) {
				throw new Error("Library (" + library + ") not found.");
			}

			const method = module[action];

			if (!method) {
				throw new Error("Method (" + action + ") not found.");
			}

			const mem = args && args.id && memoryStore.has(args.id) ? memoryStore.get(args.id) : undefined;
			const stored = args && args.id && diskStore.has(args.id) ? await diskStore.get(args.id) : undefined;

			const icon = args && args.id ? await iconStore.get(args.id) : undefined;

			const DriverDependency: Ark.DriverDependency = {
				_stores: stores,
				memEntry: mem,
				storedConnection: stored,
				icon,
			};

			return method(DriverDependency, args);
		},
	};

	return driver;
}

export type { Database };
export type { Connection };
