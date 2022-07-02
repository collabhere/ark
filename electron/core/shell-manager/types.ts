import { Evaluator } from "./evaluator";

export interface CreateShell {
    contextDB: string;
    connectionId: string;
}

export interface DestroyShell {
    shell: string;
}

export interface ShellEvalResult {
    editable: boolean;
    isCursor: boolean;
    result: Buffer;
    err?: Error;
}

export interface InvokeJS {
    code: string;
    shell: string;
    connectionId: string;
    page: number;
    limit: number;
    timeout?: number;
}

export interface ExportData extends InvokeJS {
    options: Ark.ExportCsvOptions | Ark.ExportNdjsonOptions;
}

export interface StoredShellValue {
    id: string;
    connectionId: string;
    uri: string;
    database: string;
    evaluator: Evaluator;
    validateDriver(): void;
}