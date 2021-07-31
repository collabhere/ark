import { app } from "electron";

import Bootstrap from "./bootstrap";
import { IPCHandler } from "./helpers/ipc";
import { enableDevTools } from "./utils/dev";

(async function main() {
	try {
		app.allowRendererProcessReuse = true;

		IPCHandler();

		await app.whenReady();

		if (process.env.ARK_ENABLE_DEV_TOOLS && process.env.ARK_DEV_TOOLS_PATH)
			enableDevTools(process.env.ARK_DEV_TOOLS_PATH);

		await Bootstrap();
	} catch (e) {
		console.error(e);
	}
})();
