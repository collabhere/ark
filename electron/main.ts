import { app } from "electron";

import Bootstrap from "./bootstrap";
import { registerProcessListeners } from "./helpers/ipc";

(async function main() {

	try {
		app.allowRendererProcessReuse = true;

		registerProcessListeners();

		await app.whenReady();

		Bootstrap();
	} catch (e) {
		console.error(e);
	}
})();
