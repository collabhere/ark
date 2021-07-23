import { spawn } from "child_process";

const FIND_COMMAND = /db\..*\.find\(.*?\)/g;

const codeReturnsCursor = (code: string): boolean => FIND_COMMAND.test(code);

/**
 * @name createExecutor
 * @description Executors are helper objects that can use mongosh to execute JavaScript
 * @param {String} mongoURI MongoDB server uri to connect to via mongosh 
 * @returns Executor object
 */
export function createExecutor(mongoURI: string) {
    let script = ``;

    const proc = spawn(
        __dirname + "/../../bin/mongosh"
        , [mongoURI, "--quiet"]
        ,
    );

    const {
        stdout,
        stderr,
        stdin: mongosh
    } = proc;

    let REPL_PREFIX_THING = '';

    stdout.once('data', chunk => {
        REPL_PREFIX_THING = chunk.toString();
    });

    const writeJS = (js: string) => mongosh.write(`${js}\n`);
    const append = (chunk: string) => script += chunk;
    const end = () => writeJS(script + "\n" + "exit;" + "\n");

    return {
        /**
         * @name eval
         * @description Evaluate JavaScript and paginate the result
         * @param code JavaScript code to execute
         * @param skip Pagination skip
         * @param limit Pagination limit
         * @returns { Promise<object> } Promise which resolves to JSON result of the JS provided.
         * 
         * @example
         * const URI = `mongodb://localhost:27017/test`;
         * 
         * const executor = createExecutor(URI);
         * 
         * // Result is JSON.
         * const result = await executor.eval(
         *     `db.getCollection('testcollection').find({})`,
         *     0,
         *     5
         * );
         */
        eval: (code: string, skip: number, limit: number) => {
            if (codeReturnsCursor(code)) {
                return new Promise(resolve => {
                    let result = '';
                    stdout.on('data', (chunk: any) => {
                        const output: string = chunk
                            .toString()
                            .replace(REPL_PREFIX_THING, '');
                        if (output) result += (output);
                    });
                    stdout.on("close", () => {
                        resolve(JSON.parse(result));
                    });
                    append('const cursor = ' + code + ';');
                    append(`cursor.skip(${skip});`);
                    append(`cursor.limit(${limit});`);
                    append(`JSON.stringify(cursor.toArray());`);
                    end();
                });
            } else {
                writeJS(code);
            }
        }
    };
}
