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
import { CliServiceProvider, MongoClientOptions } from "@mongosh/service-provider-server";
import { bson } from "@mongosh/service-provider-core";
import { EventEmitter } from 'stream';

import { _evaluate } from "./_eval";

export interface EvalResult {
    result?: Buffer;
    err?: Error;
}

export interface Evaluator {
    evaluate(code: string, database: string): Promise<Ark.AnyObject>;
    disconnect(): Promise<void>;
}

interface CreateEvaluatorOptions {
    uri: string;
    mongoOptions: MongoClientOptions;
}

export async function createEvaluator(options: CreateEvaluatorOptions): Promise<Evaluator> {
    let {
        uri,
        mongoOptions
    } = options;

    const provider = await createServiceProvider(uri, mongoOptions);

    const evaluator: Evaluator = {
        evaluate: (code, database) => {
            return evaluate(code, provider, { database });
        },
        disconnect: async () => {
            await provider.close(true);
        }
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

async function evaluate(
    code: string,
    serviceProvider: CliServiceProvider,
    options: MongoEvalOptions
) {
    const {
        database,
        page
    } = options;

    const internalState = new ShellInternalState(serviceProvider);

    const mongo = new Mongo(internalState, undefined, undefined, undefined, serviceProvider);

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
        result = await paginateCursor(result, (page || 1)).toArray();
    }

    return result;
}
