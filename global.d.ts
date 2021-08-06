import * as ConnectionLibrary from "./electron/library/connection";

declare global {
    namespace Ark {
        interface RunCommand {
            <R = Record<string, unknown>>(library: "connection", action: keyof typeof ConnectionLibrary, args: any): Promise<R>;
        }

        interface Driver {
            run: RunCommand;
        }

        interface Shell {
            create: (uri: string) => Promise<{ id: string; }>;
            eval: <R = Record<string, unknown>>(shellId: string, code: string) => Promise<string | R>;
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
