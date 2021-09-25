import React, { useState, useEffect, FC } from "react";
import "./App.less";
import { Browser } from "./components/browser/Browser";
import { Explorer } from "./components/explorer/Explorer";
import { PageBody } from "./components/layout/PageBody";

import { PageHeader } from "./components/layout/PageHeader";
import { ConnectionManager } from "./components/connection-manager/ConnectionManager";
import { Sidebar } from "./components/sidebar/Sidebar";
import { Hotkeys } from "./common/components/Hotkeys";

const App: FC = () => {
	const [enableHotkeys, setEnableHotkeys] = useState(true);

	// App load effect
	useEffect(() => {}, []);

	return (
		<div className="App">
			{enableHotkeys && <Hotkeys />}
			<PageHeader />
			<PageBody>
				<Sidebar />
				<Explorer />
				<ConnectionManager />
				<Browser />
			</PageBody>
		</div>
	);
};

export default App;
