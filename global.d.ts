import type { EvalResult } from "./electron/core/evaluator";
import type { Connection, Database } from "./electron/core/driver";
import type { MongoClientOptions } from "@mongosh/service-provider-server";
import type { MemoryStore } from "./electron/core/stores/memory";
import type { MemEntry } from "./electron/modules/ipc";
import type { DiskStore } from "./electron/core/stores/disk";

declare global {
	namespace Ark {
		interface DriverDependency {
			memoryStore: MemoryStore<MemEntry>;
			diskStore: DiskStore;
		}
		interface StoredConnection {
			id: string;
			name: string;
			members: Array<string>;
			database: string;
			username: string;
			password: string;
			type: "directConnection" | "replicaSet";
			options: Pick<
				MongoClientOptions,
				"authSource" | "retryWrites" | "tls" | "tlsCertificateFile" | "w"
			>;
			ssh?: {
				host: string;
				port: string;
				username: string;
				method: "privateKey" | "password";
				privateKey: string;
				passphrase?: string;
				askEachTime: boolean;
			};
		}

		type AnyObject = Record<string, unknown> | Record<string, unknown>[];

		interface Driver {
			run<D extends keyof Database>(
				library: "database",
				action: D,
				arg: Parameters<Database[D]>[1]
			): ReturnType<Database[D]>;
			run<C extends keyof Connection>(
				library: "connection",
				action: C,
				arg: Parameters<Connection[C]>[1]
			): ReturnType<Connection[C]>;
		}

		interface ShellProps {
			uri: string;
			members: string[];
			database: string;
			username: string;
			collection: string;
		}
		interface Shell {
			create: (uri: string, contextDB: string) => Promise<{ id: string }>;
			destroy: (uri: string) => Promise<{ id: string }>;
			eval: (shellId: string, code: string) => Promise<EvalResult>;
			export: (shellId: string, code: string) => Promise<void>;
		}
		interface Context {
			driver: Driver;
			shell: Shell;
			[k: string]: any;
		}
	}
	interface Window {
		ark: Ark.Context;
	}
}
