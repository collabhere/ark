import * as ConnectionLibrary from "./electron/library/connection";
import { EvalResult } from "./electron/helpers/shell-executor";

declare global {
    namespace Ark {

        type AnyObject = Record<string, unknown> | Record<string, unknown>[];

        interface RunCommand {
            <R = Record<string, unknown>>(library: "connection", action: keyof typeof ConnectionLibrary, args: any): Promise<R>;
        }

        interface Driver {
            run: RunCommand;
        }

        interface Shell {
            create: (uri: string) => Promise<{ id: string; }>;
            eval: (shellId: string, code: string) => Promise<{ result: EvalResult; err: any; }>;
        }
        interface Context {
            driver: Driver;
            shell: Shell;
            [k: string]: any;
        }
    }
    interface Window {
        ark: Ark.Context;
    }
}
