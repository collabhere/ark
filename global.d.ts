import * as ConnectionLibrary from "./electron/library/connection";
import { EvalResult } from "./electron/helpers/mongo-eval";
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

		interface RunCommand {
			(
				library: "connection",
				action: "create",
				args: { id: string }
			): Promise<void>;
			(
				library: "connection",
				action: "disconnect",
				args: { id: string }
			): Promise<void>;
			(
				library: "connection",
				action: "getConnectionDetails",
				args: { id: string }
			): Promise<Ark.StoredConnection>;
			(
				library: "connection",
				action: "saveConnectionFromUri",
				args: { type: "uri"; uri: string; name: string }
			): Promise<string>;
			(
				library: "connection",
				action: "saveConnectionFromConfig",
				args: { type: "config"; config: Ark.StoredConnection }
			): Promise<string>;
			(
				library: "connection",
				action: "delete",
				args: { id: string }
			): Promise<void>;
			// <R = Record<string, unknown>>(library: "connection", action: keyof typeof ConnectionLibrary, args: any): Promise<R>;
		}

		interface Driver {
			run: RunCommand;
		}

		interface Shell {
			create: (uri: string) => Promise<{ id: string }>;
			eval: (
				shellId: string,
				code: string
			) => Promise<{ result: EvalResult; err: any }>;
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
