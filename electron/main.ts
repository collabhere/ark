import { app } from "electron";

import Bootstrap from "./bootstrap";

app.allowRendererProcessReuse = true;

app.whenReady().then(function () {
	try {
		Bootstrap.boot();
	} catch (e) {
		console.error(e);
	}
});

