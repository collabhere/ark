import React, { useEffect, useState } from "react";
import "./App.less";
import { Browser } from "./components/browser/Browser";
import { Explorer } from "./components/explorer/Explorer";
import { PageBody } from "./components/layout/PageBody";

import { PageHeader } from "./components/layout/PageHeader";
import { SideBar } from "./components/sidebar/sidebar";

function App(): JSX.Element {
	const [showExplorer, setShowExplorer] = useState(true);

	// App load effect
	useEffect(() => {}, []);

	return (
		<div className="App">
			<PageHeader />
			<PageBody>
				<SideBar />
				<Explorer open={showExplorer} />
				<Browser />
			</PageBody>
		</div>
	);
}

export default App;
