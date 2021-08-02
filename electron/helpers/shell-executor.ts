import { spawn } from "child_process";
import defaults from "defaults";

const FIND_COMMAND = /db\..*\.find\(.*?\)/g;

const codeReturnsCursor = (code: string): boolean => FIND_COMMAND.test(code);

export interface ShellExecutorOptions {
    shellQueryTimeoutMS?: number;
}

export interface ShellExecutor {
    running: () => boolean;
    eval: (code: string, skip?: number, limit?: number) => Promise<any>;
    destroy: () => void;
}

/**
 * @name createExecutor
 * @description Executors are helper objects that can use mongosh to execute JavaScript
 * @param {String} mongoURI MongoDB server uri to connect to via mongosh 
 * @returns Executor object
 */
export function createExecutor(mongoURI: string, options?: ShellExecutorOptions): ShellExecutor {

    options = defaults(options, {
        shellQueryTimeoutMS: 20000
    } as Required<ShellExecutorOptions>)

    let script = ``;
    let running = false;

    const proc = spawn(
        __dirname + "/../../../bin/mongosh"
        , [mongoURI, "--quiet"]
    );

    const {
        stdout,
        stderr,
        stdin: mongosh
    } = proc;

    let REPL_PREFIX_THING = '';

    proc.on('error', function (err) {
        console.error("mongosh process err");
        console.error(err);
    });

    stdout.once('data', chunk => (
        REPL_PREFIX_THING = chunk.toString(),
        running = true
    ));

    stdout.on("close", () => {
        running = false;
    });

    const writeToShell = (js: string) => (
        mongosh.write(`${js}\n`),
        script = ``
    );

    const append = (chunk: string) => script += chunk;
    const end = () => writeToShell(script + "\n");

    const cleanupOutputChunk = (chunk: string): string => chunk
        .toString()
        .replace(/(\.\.\.)/gi, '')
        .replace(/(\n)|(\r\n)/gi, '');

    const readShellResponse = (cb: (response: any, isJSON: boolean) => void) => {
        let result = '';
        let seenFirstPrefix = false;
        const onData = (chunk: any) => {
            const output: string = cleanupOutputChunk(chunk.toString());

            if (output) result += (output.replace(REPL_PREFIX_THING, ''));

            if (output.includes(REPL_PREFIX_THING) && seenFirstPrefix) {
                let response;
                let isJSON = true;
                try {
                    response = JSON.parse(result);
                } catch {
                    isJSON = false;
                    response = result;
                }
                cb(response, isJSON);
                stdout.removeListener('data', onData);
            }

            if (output.includes(REPL_PREFIX_THING) && !seenFirstPrefix) {
                seenFirstPrefix = true;
            }
        }

        stdout.on('data', onData);
    }

    return {
        running: () => running,
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
        eval: async (code: string, skip?: number, limit?: number) => {
            if (running) {
                console.log("ShellExecutor eval");
                return new Promise(resolve => {
                    readShellResponse((response, isJSON) => resolve({ response, isJSON }));
                    if (codeReturnsCursor(code)) {
                        append('const cursor = ' + code + ';');
                        append(`cursor.skip(${skip || 0});`);
                        append(`cursor.limit(${limit || 50});`);
                        append(`JSON.stringify(cursor.toArray());`);
                        end();
                    } else {
                        writeToShell(code);
                    }
                });
            } else {
                throw new Error("Shell is not running.");
            }
        },
        destroy: () => {
            running = false;
            proc.kill("SIGINT");
        }
    };
}
