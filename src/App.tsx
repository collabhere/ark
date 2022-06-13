import React, { FC, useEffect } from "react";
import "./App.less";
import { Browser } from "./components/browser/Browser";
import { Explorer } from "./components/explorer/Explorer";
import { BaseContextProvider } from "./components/layout/BaseContextProvider";

import { ConnectionController } from "./components/connection-controller/ConnectionController";
import { Sidebar } from "./components/sidebar/Sidebar";
import { dispatch } from "./common/utils/events";

const App: FC = () => {
	useEffect(() => {
		dispatch("browser:create_tab:editor", {
			shellConfig: {
				id: "KIdHZGuO6g7z9WOA-Y50q",
				protocol: "mongodb",
				name: "Local Test",
				type: "directConnection",
				hosts: ["localhost:27017"],
				options: {},
				ssh: { useSSH: false },
				icon: false,
				uri: "mongodb://localhost:27017/admin",
				collection: "videos",
			},
			contextDB: "tldv",
			collections: ["videos"],
			storedConnectionId: "KIdHZGuO6g7z9WOA-Y50q",
		});
	}, []);
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
