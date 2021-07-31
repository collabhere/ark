import { app, session } from "electron";
import path from "path";
import os, { type } from "os";

import Bootstrap from "./bootstrap";
import { IPCHandler } from "./helpers/ipc";

(async function main() {
	try {
		app.allowRendererProcessReuse = true;

		IPCHandler();

		const reactDevToolsPath = path.join(
			os.homedir(),
			"/.config/google-chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.14.0_0"
		);

		await app.whenReady().then(async () => {
			await session.defaultSession.loadExtension(reactDevToolsPath);
		});

		await Bootstrap();
	} catch (e) {
		console.error(e);
	}
})();
