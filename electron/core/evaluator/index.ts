import AsyncWriter from "@mongosh/async-rewriter2";
import {
	Mongo,
	Database,
	ShellInstanceState,
	Cursor,
	ShellApi,
	ReplicaSet,
	Shard,
} from "@mongosh/shell-api";
import { bson } from "@mongosh/service-provider-core";
import { CliServiceProvider, MongoClientOptions } from "@mongosh/service-provider-server";
import { EventEmitter } from "stream";
import { exportData, MongoExportOptions } from "../../modules/exports";

import { _evaluate } from "./_eval";

export interface EvalResult {
	result?: Buffer;
	err?: Error;
}

export interface Evaluator {
	evaluate(code: string, database: string): Promise<Ark.AnyObject>;
	disconnect(): Promise<void>;
	export(
		code: string,
		database: string,
		options: Ark.ExportCsvOptions | Ark.ExportNdjsonOptions
	): Promise<void>;
}

interface CreateEvaluatorOptions {
	uri: string;
	mongoOptions: MongoClientOptions;
}

export async function createEvaluator(
	options: CreateEvaluatorOptions
): Promise<Evaluator> {
	const { uri, mongoOptions } = options;

	const provider = await createServiceProvider(uri, mongoOptions);

	const evaluator: Evaluator = {
		export: (code, database, options) => {
			return evaluate(code, provider, {
				mode: "export",
				params: { database, ...options },
			});
		},
		evaluate: (code, database) => {
			return evaluate(code, provider, { mode: "query", params: { database } });
		},
		disconnect: async () => {
			await provider.close(true);
		},
	};

	return evaluator;
}

async function createServiceProvider(uri: string, driverOpts: MongoClientOptions = {}) {
	const provider = await CliServiceProvider.connect(uri, driverOpts, {}, new EventEmitter());
	return provider
}

function paginateCursor(cursor: Cursor, page: number) {
	return cursor.limit(50).skip((page - 1) * 50);
}

interface MongoEvalOptions {
	database: string;
	page?: number;
}
interface MongoQueryOptions {
	mode: "query";
	params: MongoEvalOptions;
}

async function evaluate(
	code: string,
	serviceProvider: CliServiceProvider,
	options: MongoQueryOptions | MongoExportOptions<MongoEvalOptions>
) {
	const { database, page } = options.params;

	const internalState = new ShellInstanceState(serviceProvider);

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

	let result = await _evaluate(
		transpiledCodeString,
		db,
		rs,
		sh,
		shellApi,
		bson
	);

	if (result instanceof Cursor) {
		if (options.mode === "export") {
			return await exportData(result, options);
		} else {
			result = await paginateCursor(result, page || 1).toArray();
		}
	}

	return result;
}
