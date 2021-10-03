import AsyncWriter from "@mongosh/async-rewriter2";
import {
	Mongo,
	Database,
	ShellInternalState,
	Cursor,
	ShellApi,
	ReplicaSet,
	Shard,
} from "@mongosh/shell-api";
import { ConnectOptions as DriverConnectOptions } from "mongodb";
import { CliServiceProvider } from "@mongosh/service-provider-server";
import { EventEmitter } from "stream";
import { CSVTransform } from "../../modules/exports/csv-transform";

import { _evaluate } from "./_eval";
import { createWriteStream } from "fs";
import { ARK_FOLDER_PATH } from "../../utils/constants";

export interface EvalResult {
	result?: Buffer;
	err?: Error;
}

export interface Evaluator {
	evaluate(code: string, database: string): Promise<Ark.AnyObject>;
	disconnect(): Promise<void>;
	export(code: string, database: string): Promise<void>;
}

interface CreateEvaluatorOptions {
	uri: string;
}

export async function createEvaluator(
	options: CreateEvaluatorOptions
): Promise<Evaluator> {
	const { uri } = options;

	const provider = await createServiceProvider(uri);

	const evaluator: Evaluator = {
		export: (code, database) => {
			return evaluate(code, provider, { database, mode: "export" });
		},
		evaluate: (code, database) => {
			return evaluate(code, provider, { database });
		},
		disconnect: async () => {
			await provider.close(true);
		},
	};

	return evaluator;
}

async function createServiceProvider(
	uri: string,
	driverOpts: DriverConnectOptions = {}
) {
	return await CliServiceProvider.connect(
		uri,
		driverOpts,
		{},
		new EventEmitter()
	);
}

function paginateCursor(cursor: Cursor, page: number) {
	return cursor.limit(50).skip((page - 1) * 50);
}

interface MongoEvalOptions {
	database: string;
	page?: number;
	mode?: "export" | "query";
}

async function evaluate(
	code: string,
	serviceProvider: CliServiceProvider,
	options: MongoEvalOptions
) {
	const { database, page, mode } = options;

	const internalState = new ShellInternalState(serviceProvider);

	const mongo = new Mongo(
		internalState,
		undefined,
		undefined,
		undefined,
		serviceProvider
	);

	const db = new Database(mongo, database);

	const rs = new ReplicaSet(db);

	const sh = new Shard(db);

	const shellApi = new ShellApi(internalState);

	const transpiledCodeString = new AsyncWriter().process(code);

	let result = await _evaluate(transpiledCodeString, db, rs, sh, shellApi);

	if (mode === "export") {
		const transform = CSVTransform({ destructureData: true });
		const write = createWriteStream(`${ARK_FOLDER_PATH}/exports/test.csv`);

		return new Promise((resolve, reject) => {
			if (result instanceof Cursor) {
				const stream = result._cursor.stream();

				transform.on("error", (err) => {
					reject(err);
				});

				write.on("close", () => {
					resolve("");
				});

				stream.pipe(transform).pipe(write);
			}
		});
	} else if (result instanceof Cursor) {
		result = await paginateCursor(result, page || 1).toArray();
	}

	return result;
}
