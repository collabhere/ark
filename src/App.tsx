import React, { FC } from "react";
import "./App.less";
import { Browser } from "./components/browser/Browser";
import { Explorer } from "./components/explorer/Explorer";
import { BaseContextProvider } from "./components/layout/BaseContextProvider";

import { ConnectionController } from "./components/connection-controller/ConnectionController";
import { Sidebar } from "./components/sidebar/Sidebar";

const App: FC = () => {
	return (
		<div className="App">
			<BaseContextProvider>
				<Sidebar />
				<Explorer />
				<ConnectionController />
				<Browser />
			</BaseContextProvider>
		</div>
	);
};

export default App;
