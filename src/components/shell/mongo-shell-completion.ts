import MONGO_SHELL_GLOBAL_DEFINITION from "../../mongoshell.d.ts?raw";

import { Monaco } from "@monaco-editor/react";
import MONGO_SHELL_API_ABSTRACT_CURSOR from "@mongosh/shell-api/lib/abstract-cursor.d.ts?raw";
import MONGO_SHELL_API_AGGREGATION_CURSOR from "@mongosh/shell-api/lib/aggregation-cursor.d.ts?raw";
import MONGO_SHELL_API_BULK from "@mongosh/shell-api/lib/bulk.d.ts?raw";
import MONGO_SHELL_API_CHANGE_STREAM_CURSOR from "@mongosh/shell-api/lib/change-stream-cursor.d.ts?raw";
import MONGO_SHELL_API_COLLECTION from "@mongosh/shell-api/lib/collection.d.ts?raw";
import MONGO_SHELL_API_CURSOR from "@mongosh/shell-api/lib/cursor.d.ts?raw";
import MONGO_SHELL_API_DATABASE from "@mongosh/shell-api/lib/database.d.ts?raw";
import MONGO_SHELL_API_DBQUERY from "@mongosh/shell-api/lib/dbquery.d.ts?raw";
import MONGO_SHELL_API_DECORATORS from "@mongosh/shell-api/lib/decorators.d.ts?raw";
import MONGO_SHELL_API_ENUMS from "@mongosh/shell-api/lib/enums.d.ts?raw";
import MONGO_SHELL_API_ERROR_CODES from "@mongosh/shell-api/lib/error-codes.d.ts?raw";
import MONGO_SHELL_API_EXPLAINABLE_CURSOR from "@mongosh/shell-api/lib/explainable-cursor.d.ts?raw";
import MONGO_SHELL_API_EXPLAINABLE from "@mongosh/shell-api/lib/explainable.d.ts?raw";
import MONGO_SHELL_API_FIELD_LEVEL_ENCRYPTION from "@mongosh/shell-api/lib/field-level-encryption.d.ts?raw";
import MONGO_SHELL_API_HELP from "@mongosh/shell-api/lib/help.d.ts?raw";
import MONGO_SHELL_API_HELPERS from "@mongosh/shell-api/lib/helpers.d.ts?raw";
import MONGO_SHELL_API_INDEX from "@mongosh/shell-api/lib/index.d.ts?raw";
import MONGO_SHELL_API_INTERRUPTOR from "@mongosh/shell-api/lib/interruptor.d.ts?raw";
import MONGO_SHELL_API_MONGO_ERRORS from "@mongosh/shell-api/lib/mongo-errors.d.ts?raw";
import MONGO_SHELL_API_MONGO from "@mongosh/shell-api/lib/mongo.d.ts?raw";
import MONGO_SHELL_API_NO_DB from "@mongosh/shell-api/lib/no-db.d.ts?raw";
import MONGO_SHELL_API_PLAN_CACHE from "@mongosh/shell-api/lib/plan-cache.d.ts?raw";
import MONGO_SHELL_API_REPLICA_SET from "@mongosh/shell-api/lib/replica-set.d.ts?raw";
import MONGO_SHELL_API_RESULT from "@mongosh/shell-api/lib/result.d.ts?raw";
import MONGO_SHELL_API_SESSION from "@mongosh/shell-api/lib/session.d.ts?raw";
import MONGO_SHELL_API_SHARD from "@mongosh/shell-api/lib/shard.d.ts?raw";
import MONGO_SHELL_API_SHELL_API from "@mongosh/shell-api/lib/shell-api.d.ts?raw";
import MONGO_SHELL_API_SHELL_BSON from "@mongosh/shell-api/lib/shell-bson.d.ts?raw";
import MONGO_SHELL_API_SHELL_INSTANCE_STATE from "@mongosh/shell-api/lib/shell-instance-state.d.ts?raw";

const MONGO_SHELL_TYPE_DEFINITIONS = [
	{ name: "abstract-cursor.d.ts", code: MONGO_SHELL_API_ABSTRACT_CURSOR },
	{ name: "aggregation-cursor.d.ts", code: MONGO_SHELL_API_AGGREGATION_CURSOR },
	{ name: "bulk.d.ts", code: MONGO_SHELL_API_BULK },
	{ name: "change-stream-cursor.d.ts", code: MONGO_SHELL_API_CHANGE_STREAM_CURSOR },
	{ name: "collection.d.ts", code: MONGO_SHELL_API_COLLECTION },
	{ name: "cursor.d.ts", code: MONGO_SHELL_API_CURSOR },
	{ name: "database.d.ts", code: MONGO_SHELL_API_DATABASE },
	{ name: "dbquery.d.ts", code: MONGO_SHELL_API_DBQUERY },
	{ name: "decorators.d.ts", code: MONGO_SHELL_API_DECORATORS },
	{ name: "enums.d.ts", code: MONGO_SHELL_API_ENUMS },
	{ name: "error-codes.d.ts", code: MONGO_SHELL_API_ERROR_CODES },
	{ name: "explainable-cursor.d.ts", code: MONGO_SHELL_API_EXPLAINABLE_CURSOR },
	{ name: "explainable.d.ts", code: MONGO_SHELL_API_EXPLAINABLE },
	{ name: "field-level-encryption.d.ts", code: MONGO_SHELL_API_FIELD_LEVEL_ENCRYPTION },
	{ name: "help.d.ts", code: MONGO_SHELL_API_HELP },
	{ name: "helpers.d.ts", code: MONGO_SHELL_API_HELPERS },
	{ name: "index.d.ts", code: MONGO_SHELL_API_INDEX },
	{ name: "interruptor.d.ts", code: MONGO_SHELL_API_INTERRUPTOR },
	{ name: "mongo.d.ts", code: MONGO_SHELL_API_MONGO },
	{ name: "mongo-errors.d.ts", code: MONGO_SHELL_API_MONGO_ERRORS },
	{ name: "no-db.d.ts", code: MONGO_SHELL_API_NO_DB },
	{ name: "plan-cache.d.ts", code: MONGO_SHELL_API_PLAN_CACHE },
	{ name: "replica-set.d.ts", code: MONGO_SHELL_API_REPLICA_SET },
	{ name: "result.d.ts", code: MONGO_SHELL_API_RESULT },
	{ name: "session.d.ts", code: MONGO_SHELL_API_SESSION },
	{ name: "shard.d.ts", code: MONGO_SHELL_API_SHARD },
	{ name: "shell-api.d.ts", code: MONGO_SHELL_API_SHELL_API },
	{ name: "shell-bson.d.ts", code: MONGO_SHELL_API_SHELL_BSON },
	{ name: "shell-internal-state.d.ts", code: MONGO_SHELL_API_SHELL_INSTANCE_STATE },
];

// Should match:
// Promise<Document | null>;
// Promise<Document ? >;
// Promise<Document>;
// Promise<Document[]>;
// Promise<Array<Document[]>>;
// forEach(f: (doc: Document) => void | boolean | Promise<void   > | Promise<boolean>): Promise<void>;
// Should not match:
// AbstractCursor<ServiceProviderCursor>;
// const TS_PROMISE_GENERIC_RGX = /(Promise<(?=.*))|((?<=[\s\w])>(?=;|\s|\)))/gim;
const TS_PROMISE_GENERIC_RGX = /(Promise<(?=[\w[\]]+))|((?<=(Promise<[\s\w[\]|?<]+))>)/gim;

function modifyMongoShellLibCode(code: string): string {
	return (
		code
			// We do not need any promises in the definition files
			.replace(TS_PROMISE_GENERIC_RGX, "")
	);
}

export function addMongoShellCompletions(monaco: Monaco): void {
	for (const definition of MONGO_SHELL_TYPE_DEFINITIONS) {
		const path = "file:///node_modules/@mongosh/shell-api/" + definition.name;
		const libCode = modifyMongoShellLibCode(definition.code);
		monaco.languages.typescript.typescriptDefaults.addExtraLib(libCode, path);
	}

	monaco.languages.typescript.typescriptDefaults.addExtraLib(
		MONGO_SHELL_GLOBAL_DEFINITION,
		"file:///node_modules/@types/global.d.ts",
	);
}
