import { EvalResult } from "./electron/core/evaluator";
import { Connection, Database } from "./electron/core/driver";
import { MongoClientOptions } from "@mongosh/service-provider-server";

declare global {
	namespace Ark {
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
			run<T extends keyof Database>(
				library: "database",
				action: T,
				arg: Parameters<Database[T]>[0]
			): ReturnType<Database[T]>;
			run<T extends keyof Connection>(
				library: "connection",
				action: T,
				arg: Parameters<Connection[T]>[0]
			): ReturnType<Connection[T]>;
		}

		interface ShellProps {
			uri: string;
			members: string[];
			database: string;
			username: string;
			collection?: string;
		}
		interface Shell {
			create: (ShellProps: ShellProps, contextDB: string) => Promise<{ id: string }>;
			eval: (
				shellId: string,
				code: string
			) => Promise<EvalResult>;
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
