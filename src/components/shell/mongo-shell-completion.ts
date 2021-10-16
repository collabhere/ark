
import MONGO_SHELL_GLOBAL_DEFINITION from "../../mongoshell.d.ts?raw";

import MONGO_SHELL_CORE_ALL_FLE_TYPES from "@mongosh/service-provider-core/lib/all-fle-types.d.ts?raw";
import MONGO_SHELL_CORE_ALL_TRANSPORT_TYPES from "@mongosh/service-provider-core/lib/all-transport-types.d.ts?raw";
import MONGO_SHELL_CORE_ADMIN from "@mongosh/service-provider-core/lib/admin.d.ts?raw";
import MONGO_SHELL_CORE_CLI_OPTIONS from "@mongosh/service-provider-core/lib/cli-options.d.ts?raw";
import MONGO_SHELL_CORE_CLOSABLE from "@mongosh/service-provider-core/lib/closable.d.ts?raw";
import MONGO_SHELL_CORE_CONNECT_INFO from "@mongosh/service-provider-core/lib/connect-info.d.ts?raw";
import MONGO_SHELL_CORE_FAST_FAILURE_CONNECT from "@mongosh/service-provider-core/lib/fast-failure-connect.d.ts?raw";
import MONGO_SHELL_CORE_INDEX from "@mongosh/service-provider-core/lib/index.d.ts?raw";
import MONGO_SHELL_CORE_PLATFORM from "@mongosh/service-provider-core/lib/platform.d.ts?raw";
import MONGO_SHELL_CORE_PRINTABLE_BSON from "@mongosh/service-provider-core/lib/printable-bson.d.ts?raw";
import MONGO_SHELL_CORE_READABLE from "@mongosh/service-provider-core/lib/readable.d.ts?raw";
import MONGO_SHELL_CORE_SERVICE_PROVIDER from "@mongosh/service-provider-core/lib/service-provider.d.ts?raw";
import MONGO_SHELL_CORE_SHELL_AUTH_OPTIONS from "@mongosh/service-provider-core/lib/shell-auth-options.d.ts?raw";
import MONGO_SHELL_CORE_TEXTENCODER_POLYFILL from "@mongosh/service-provider-core/lib/textencoder-polyfill.d.ts?raw";
import MONGO_SHELL_CORE_URI_GENERATOR from "@mongosh/service-provider-core/lib/uri-generator.d.ts?raw";
import MONGO_SHELL_CORE_WRITABLE from "@mongosh/service-provider-core/lib/writable.d.ts?raw";
import MONGO_SHELL_API_ABSTRACT_CURSOR from "@mongosh/shell-api/lib/abstract-cursor.d.ts?raw";
import MONGO_SHELL_API_AGGREGATION_CURSOR from "@mongosh/shell-api/lib/aggregation-cursor.d.ts?raw";
import MONGO_SHELL_API_BULK from "@mongosh/shell-api/lib/bulk.d.ts?raw";
import MONGO_SHELL_API_CHANGE_STREAM_CURSOR from "@mongosh/shell-api/lib/change-stream-cursor.d.ts?raw";
import MONGO_SHELL_API_COLLECTION from "@mongosh/shell-api/lib/collection.d.ts?raw";
import MONGO_SHELL_API_CURSOR from "@mongosh/shell-api/lib/cursor.d.ts?raw";
import MONGO_SHELL_API_DATABASE from "@mongosh/shell-api/lib/database.d.ts?raw";
import MONGO_SHELL_API_DBQUERY from "@mongosh/shell-api/lib/dbquery.d.ts?raw";
import MONGO_SHELL_API_DECORATORS from "@mongosh/shell-api/lib/decorators.d.ts?raw";
import MONGO_SHELL_API_DEPRECATION_WARNING from "@mongosh/shell-api/lib/deprecation-warning.d.ts?raw";
import MONGO_SHELL_API_ENUMS from "@mongosh/shell-api/lib/enums.d.ts?raw";
import MONGO_SHELL_API_ERROR_CODES from "@mongosh/shell-api/lib/error-codes.d.ts?raw";
import MONGO_SHELL_API_EXPLAINABLE_CURSOR from "@mongosh/shell-api/lib/explainable-cursor.d.ts?raw";
import MONGO_SHELL_API_EXPLAINABLE from "@mongosh/shell-api/lib/explainable.d.ts?raw";
import MONGO_SHELL_API_FIELD_LEVEL_ENCRYPTION from "@mongosh/shell-api/lib/field-level-encryption.d.ts?raw";
import MONGO_SHELL_API_HELP from "@mongosh/shell-api/lib/help.d.ts?raw";
import MONGO_SHELL_API_HELPERS from "@mongosh/shell-api/lib/helpers.d.ts?raw";
import MONGO_SHELL_API_INDEX from "@mongosh/shell-api/lib/index.d.ts?raw";
import MONGO_SHELL_API_INTERRUPTOR from "@mongosh/shell-api/lib/interruptor.d.ts?raw";
import MONGO_SHELL_API_MONGO from "@mongosh/shell-api/lib/mongo.d.ts?raw";
import MONGO_SHELL_API_MONGO_ERRORS from "@mongosh/shell-api/lib/mongo-errors.d.ts?raw";
import MONGO_SHELL_API_NO_DB from "@mongosh/shell-api/lib/no-db.d.ts?raw";
import MONGO_SHELL_API_PLAN_CACHE from "@mongosh/shell-api/lib/plan-cache.d.ts?raw";
import MONGO_SHELL_API_REPLICA_SET from "@mongosh/shell-api/lib/replica-set.d.ts?raw";
import MONGO_SHELL_API_RESULT from "@mongosh/shell-api/lib/result.d.ts?raw";
import MONGO_SHELL_API_SESSION from "@mongosh/shell-api/lib/session.d.ts?raw";
import MONGO_SHELL_API_SHARD from "@mongosh/shell-api/lib/shard.d.ts?raw";
import MONGO_SHELL_API_SHELL_API from "@mongosh/shell-api/lib/shell-api.d.ts?raw";
import MONGO_SHELL_API_SHELL_BSON from "@mongosh/shell-api/lib/shell-bson.d.ts?raw";
import MONGO_SHELL_API_SHELL_INTERNAL_STATE from "@mongosh/shell-api/lib/shell-internal-state.d.ts?raw";
import { Monaco } from "@monaco-editor/react";

const MONGO_SHELL_TYPE_DEFINITIONS = [
    { name: "all-fle-types.d.ts", code: MONGO_SHELL_CORE_ALL_FLE_TYPES },
    { name: "all-transport-types.d.ts", code: MONGO_SHELL_CORE_ALL_TRANSPORT_TYPES },
    { name: "admin.d.ts", code: MONGO_SHELL_CORE_ADMIN },
    { name: "cli-options.d.ts", code: MONGO_SHELL_CORE_CLI_OPTIONS },
    { name: "closable.d.ts", code: MONGO_SHELL_CORE_CLOSABLE },
    { name: "connect-info.d.ts", code: MONGO_SHELL_CORE_CONNECT_INFO },
    { name: "fast-failure-connect.d.ts", code: MONGO_SHELL_CORE_FAST_FAILURE_CONNECT },
    { name: "index.d.ts", code: MONGO_SHELL_CORE_INDEX },
    { name: "platform.d.ts", code: MONGO_SHELL_CORE_PLATFORM },
    { name: "printable-bson.d.ts", code: MONGO_SHELL_CORE_PRINTABLE_BSON },
    { name: "readable.d.ts", code: MONGO_SHELL_CORE_READABLE },
    { name: "service-provider.d.ts", code: MONGO_SHELL_CORE_SERVICE_PROVIDER },
    { name: "shell-auth-options.d.ts", code: MONGO_SHELL_CORE_SHELL_AUTH_OPTIONS },
    { name: "textencoder-polyfill.d.ts", code: MONGO_SHELL_CORE_TEXTENCODER_POLYFILL },
    { name: "uri-generator.d.ts", code: MONGO_SHELL_CORE_URI_GENERATOR },
    { name: "writable.d.ts", code: MONGO_SHELL_CORE_WRITABLE },
    { name: "abstract-cursor.d.ts", code: MONGO_SHELL_API_ABSTRACT_CURSOR, },
    { name: "aggregation-cursor.d.ts", code: MONGO_SHELL_API_AGGREGATION_CURSOR, },
    { name: "bulk.d.ts", code: MONGO_SHELL_API_BULK, },
    { name: "change-stream-cursor.d.ts", code: MONGO_SHELL_API_CHANGE_STREAM_CURSOR, },
    { name: "collection.d.ts", code: MONGO_SHELL_API_COLLECTION, },
    { name: "cursor.d.ts", code: MONGO_SHELL_API_CURSOR, },
    { name: "database.d.ts", code: MONGO_SHELL_API_DATABASE, },
    { name: "dbquery.d.ts", code: MONGO_SHELL_API_DBQUERY, },
    { name: "decorators.d.ts", code: MONGO_SHELL_API_DECORATORS, },
    { name: "deprecation-warning.d.ts", code: MONGO_SHELL_API_DEPRECATION_WARNING, },
    { name: "enums.d.ts", code: MONGO_SHELL_API_ENUMS, },
    { name: "error-codes.d.ts", code: MONGO_SHELL_API_ERROR_CODES, },
    { name: "explainable-cursor.d.ts", code: MONGO_SHELL_API_EXPLAINABLE_CURSOR, },
    { name: "explainable.d.ts", code: MONGO_SHELL_API_EXPLAINABLE, },
    { name: "field-level-encryption.d.ts", code: MONGO_SHELL_API_FIELD_LEVEL_ENCRYPTION, },
    { name: "help.d.ts", code: MONGO_SHELL_API_HELP, },
    { name: "helpers.d.ts", code: MONGO_SHELL_API_HELPERS, },
    { name: "index.d.ts", code: MONGO_SHELL_API_INDEX, },
    { name: "interruptor.d.ts", code: MONGO_SHELL_API_INTERRUPTOR, },
    { name: "mongo.d.ts", code: MONGO_SHELL_API_MONGO, },
    { name: "mongo-errors.d.ts", code: MONGO_SHELL_API_MONGO_ERRORS, },
    { name: "no-db.d.ts", code: MONGO_SHELL_API_NO_DB, },
    { name: "plan-cache.d.ts", code: MONGO_SHELL_API_PLAN_CACHE, },
    { name: "replica-set.d.ts", code: MONGO_SHELL_API_REPLICA_SET, },
    { name: "result.d.ts", code: MONGO_SHELL_API_RESULT, },
    { name: "session.d.ts", code: MONGO_SHELL_API_SESSION, },
    { name: "shard.d.ts", code: MONGO_SHELL_API_SHARD, },
    { name: "shell-api.d.ts", code: MONGO_SHELL_API_SHELL_API, },
    { name: "shell-bson.d.ts", code: MONGO_SHELL_API_SHELL_BSON, },
    { name: "shell-internal-state.d.ts?raw", code: MONGO_SHELL_API_SHELL_INTERNAL_STATE },
];

const TS_PROMISE_GENERIC_RGX = /(Promise<(?=.*))|(>(?=;))/gim;

function modifyMongoShellLibCode(code: string): string {
    return code
        // We do not need any promises in the definition files
        .replace(TS_PROMISE_GENERIC_RGX, '')
        // Since cursor methods are written in a sync
        // fashion, i.e. db.collection.find().map(...),
        // we want the types to allow for chaining array methods with cursor methods.
        .replace(/(?<=\s)Cursor(?=;)/gim, '(Cursor & Array<Document>)');
}

export function addMongoShellCompletions(monaco: Monaco): void {
    for (const definition of MONGO_SHELL_TYPE_DEFINITIONS) {
        const path = "file:///node_modules/@mongosh/shell-api/" + definition.name;
        const libCode = modifyMongoShellLibCode(definition.code);
        monaco.languages.typescript.typescriptDefaults.addExtraLib(libCode, path);
    }

    monaco.languages.typescript.typescriptDefaults.addExtraLib(MONGO_SHELL_GLOBAL_DEFINITION, 'file:///node_modules/@types/global.d.ts');
}
