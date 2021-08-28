import AsyncWriter from '@mongosh/async-rewriter2';
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
import { EventEmitter } from 'stream';

import { _evaluate } from "./_eval";

export interface EvalResult {
    result: Ark.AnyObject;
}

export interface Evaluator {
    evaluate(code: string): Promise<{ result: Ark.AnyObject }>;
    disconnect(): Promise<void>;
}

interface CreateEvaluatorOptions {
    uri: string;
    database: string;
}

export async function createEvaluator(options: CreateEvaluatorOptions): Promise<Evaluator> {
    const {
        database,
        uri
    } = options;

    const provider = await createServiceProvider(uri);

    const evaluator = {
        evaluate: (code: string) => {
            return evaluate(code, provider, { database });
        },
        disconnect: async () => {
            await provider.close(true);
        }
    };

    return evaluator;
}

async function createServiceProvider(uri: string, driverOpts: DriverConnectOptions = {}) {
    return await CliServiceProvider.connect(uri, driverOpts, {}, new EventEmitter());
}

function paginateCursor(cursor: Cursor, page: number) {
    return cursor.limit(50).skip((page - 1) * 50);
}

interface MongoEvalOptions {
    database: string;
    page?: number;
}

async function evaluate(
    code: string,
    serviceProvider: CliServiceProvider,
    options: MongoEvalOptions
) {
    const {
        database: initialDatabase,
        page
    } = options;

    const internalState = new ShellInternalState(serviceProvider);

    const mongo = new Mongo(internalState, undefined, undefined, undefined, serviceProvider);

    const db = new Database(mongo, initialDatabase);

    const rs = new ReplicaSet(db);

    const sh = new Shard(db);

    const shellApi = new ShellApi(internalState);

    const transpiledCodeString = new AsyncWriter().process(code);

    let result = await _evaluate(
        transpiledCodeString,
        db,
        rs,
        sh,
        shellApi
    );

    if (result instanceof Cursor) {
        result = await paginateCursor(result, (page || 1)).toArray();
    }

    return { result };
}
