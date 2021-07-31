import React, { useEffect, useState } from "react";
import "./App.less";
import { Browser } from "./components/browser/Browser";
import { Explorer } from "./components/explorer/Explorer";
import { PageBody } from "./components/layout/PageBody";

import { PageHeader } from "./components/layout/PageHeader";
import { SideBar } from "./components/sidebar/sidebar";
import { dispatch } from "./util/events";

function App(): JSX.Element {
	const [showExplorer, setShowExplorer] = useState(true);
	const [connectionId, setConnectionId] = useState<null | string>(null);

	// App load effect
	useEffect(() => {
		dispatch("browser:create_tab:connection_form");
		// window.ark.connection.saveConnection(
		// 	"uri",
		// 	"mongodb://test:test@ec2-3-13-197-203.us-east-2.compute.amazonaws.com:27017/klenty_test_2622",
		// 	"test-2622"
		// );
		window.ark.connection.getAllConnections().then((objConnections: any) => {
			const connectionKeys = Object.keys(objConnections);
			console.log(`connectionId: ${connectionKeys[0]}`);
			setConnectionId(connectionKeys[0]);
		});
	}, []);

	return (
		<div className="App">
			<PageHeader />
			<PageBody>
				<SideBar />
				{connectionId && (
					<Explorer open={showExplorer} connectionId={connectionId} />
				)}
				<Browser />
			</PageBody>
		</div>
	);
}

export default App;
