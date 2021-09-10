import React, { useEffect, FC } from "react";
import "./App.less";
import { Browser } from "./components/browser/Browser";
import { Explorer } from "./components/explorer/Explorer";
import { PageBody } from "./components/layout/PageBody";

import { PageHeader } from "./components/layout/PageHeader";
import { ConnectionManager } from "./components/connectionManager/ConnectionManager";
import { Sidebar } from "./components/sidebar/Sidebar";

const App: FC = () => {
	// App load effect
	useEffect(() => {}, []);

	return (
		<div className="App">
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
