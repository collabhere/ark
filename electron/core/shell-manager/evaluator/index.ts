import AsyncWriter from "@mongosh/async-rewriter2";
import {
	Mongo,
	Database,
	ShellInstanceState,
	ShellApi,
	ReplicaSet,
	Shard,
	AggregationCursor,
	Cursor,
} from "@mongosh/shell-api";
import { bson } from "@mongosh/service-provider-core";
import {
	CliServiceProvider,
	MongoClientOptions,
} from "@mongosh/service-provider-server";
import { EventEmitter } from "stream";
import { exportData } from "../../../modules/exports";

import { _evaluate } from "./_eval";
import { ObjectId } from "bson";

export interface Evaluator {
	evaluate(
		code: string,
		database: string,
		options: Ark.QueryOptions
	): Promise<{ result: Ark.AnyObject; isCursor: boolean; isNotDocumentArray: boolean; }>;
	disconnect(): Promise<void>;
	export(
		code: string,
		database: string,
		options: Ark.ExportCsvOptions | Ark.ExportNdjsonOptions
	): Promise<{ exportPath: string }>;
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
		export: async (code, database, options) => {

			const {
				db, rs, sh, shellApi
			} = createShellGlobals(provider, database);

			const transpiledCodeString = new AsyncWriter().process(code);

			let result = await _evaluate(
				transpiledCodeString,
				db,
				rs,
				sh,
				shellApi,
				bson
			);

			const exportPath = await exportData(result, options);

			return { exportPath };
		},
		evaluate: async (code, database, options) => {

			const { page, timeout, limit } = options;

			const {
				db, rs, sh, shellApi
			} = createShellGlobals(provider, database);

			const transpiledCodeString = new AsyncWriter().process(code);

			let result = await _evaluate(
				transpiledCodeString,
				db,
				rs,
				sh,
				shellApi,
				bson
			);

			let isCursor = false;
			let boolIsNotDocumentArray = false;

			if (result instanceof AggregationCursor) {
				result = await paginateAggregationCursor(
					result,
					page || 1,
					limit || 50,
					timeout
				).toArray();

				isCursor = true;

			} else if (result instanceof Cursor) {
				result = await paginateFindCursor(
					result,
					page || 1,
					limit || 50,
					timeout
				).toArray();

				isCursor = true;

			} else if (typeof result === "object" && "toArray" in result) {
				result = await result.toArray();
			} else if (isNotDocumentArray(result)) {
				boolIsNotDocumentArray = true;
			} else if (Array.isArray(result) && isNotDocumentArray(result[0])) {
				boolIsNotDocumentArray = true;
			}

			return { result, isCursor, isNotDocumentArray: boolIsNotDocumentArray };
		},
		disconnect: async () => {
			await provider.close(true);
		},
	};

	return evaluator;
}

const isNotDocumentArray = (val: any) => (val instanceof Date) || (ObjectId.isValid(val)) ||
	(!Array.isArray(val) &&
		typeof val !== "object" &&
		typeof val !== "function" &&
		typeof val !== "symbol")

async function createServiceProvider(
	uri: string,
	driverOpts: MongoClientOptions = {}
) {
	const provider = await CliServiceProvider.connect(
		uri,
		driverOpts,
		{},
		new EventEmitter()
	);
	return provider;
}

function paginateFindCursor(
	cursor: Cursor,
	page: number,
	limit: number,
	timeout?: number
) {
	const shellTimeout = timeout ? timeout * 1000 : 120000;
	return cursor
		.limit(limit)
		.skip((page - 1) * limit)
		.maxTimeMS(shellTimeout);
}

function paginateAggregationCursor(
	cursor: AggregationCursor,
	page: number,
	limit: number,
	timeout?: number
) {
	const shellTimeout = timeout ? timeout * 1000 : 120000;
	return cursor
		.skip((page - 1) * limit)
		.maxTimeMS(shellTimeout)
		._cursor.limit(limit);
}

function createShellGlobals(serviceProvider: CliServiceProvider, database: string) {
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

	return { db, rs, sh, shellApi };
}
