import { app } from "electron";

import Bootstrap from "./bootstrap";
import { IPCHandler } from "./helpers/ipc";

(async function main() {

	try {
		app.allowRendererProcessReuse = true;

		IPCHandler();

		await app.whenReady();

		await Bootstrap();
	} catch (e) {
		console.error(e);
	}
})();
