import type { EvalResult } from "./electron/core/evaluator";
import type { Connection, Database } from "./electron/core/driver";
import type { MongoClientOptions } from "@mongosh/service-provider-server";
import type { MemoryStore } from "./electron/core/stores/memory";
import type {
	MemEntry,
	StoredScript,
	ScriptSaveActionData,
	ScriptSaveAsActionData,
	ScriptOpenActionData,
} from "./electron/modules/ipc";
import type { DiskStore } from "./electron/core/stores/disk";

declare global {
	namespace Ark {
		interface DriverDependency {
			memoryStore: MemoryStore<MemEntry>;
			diskStore: DiskStore<StoredConnection>;
		}
		interface StoredConnection {
			id: string;
			name: string;
			protocol: string;
			hosts: Array<string>;
			database?: string;
			username?: string;
			password?: string;
			type: "directConnection" | "replicaSet";
			options: Pick<
				MongoClientOptions,
				| "authSource"
				| "retryWrites"
				| "tls"
				| "tlsCertificateFile"
				| "w"
				| "replicaSet"
				| "authMechanism"
			>;
			ssh: {
				useSSH?: boolean;
				host?: string;
				port?: string;
				username?: string;
				method?: "privateKey" | "password";
				password?: string;
				privateKey?: string;
				passphrase?: string;
				askEachTime?: boolean;
				mongodHost?: string;
				mongodPort?: string;
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

		interface ShellConfig {
			name: string;
			uri: string;
			hosts: string[];
			database?: string;
			username: string;
			password: string;
			collection: string;
		}

		interface ExportNdjsonOptions {
			type: "NDJSON";
			fileName: string;
		}

		interface ExportCsvOptions {
			type: "CSV";
			destructureData: boolean;
			fields?: Array<string>;
			fileName: string;
		}
		interface Shell {
			create: (
				uri: string,
				contextDB: string,
				storedConnectionId: string
			) => Promise<{ id: string }>;
			destroy: (uri: string) => Promise<{ id: string }>;
			eval: (
				shellId: string,
				code: string,
				connectionId: string
			) => Promise<EvalResult>;
			export: (
				shellId: string,
				code: string,
				connectionId: string,
				options: ExportCsvOptions | ExportNdjsonOptions
			) => Promise<void>;
		}
		interface Scripts {
			open(
				params: ScriptOpenActionData["params"]
			): Promise<{ code: string; script: StoredScript }>;
			save(params: ScriptSaveActionData["params"]): Promise<StoredScript>;
			saveAs(params: ScriptSaveAsActionData["params"]): Promise<StoredScript>;
			delete(scriptId: string): Promise<void>;
		}

		interface Context {
			browseForDirs: (
				title?: string,
				buttonLabel?: string
			) => Promise<{ dirs: string[] }>;
			browseForFile: (
				title?: string,
				buttonLabel?: string
			) => Promise<{ path: string }>;
			scripts: Scripts;
			driver: Driver;
			shell: Shell;
			[k: string]: any;
		}
	}
	interface Window {
		ark: Ark.Context;
	}
}
