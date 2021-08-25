import React, { useCallback, useEffect, useState } from "react";
import "./App.less";
import { Browser } from "./components/browser/Browser";
import { Explorer } from "./components/explorer/Explorer";
import { PageBody } from "./components/layout/PageBody";

import { PageHeader } from "./components/layout/PageHeader";
import { ConnectionManager } from "./components/connectionManager/ConnectionManager";
import { SideBar } from "./components/sidebar/sidebar";
import { dispatch, listenEffect } from "./util/events";

interface Views {
	explorer: boolean;
	connectionManager: boolean;
}

function App(): JSX.Element {
	const [currentView, setCurrentView] = useState<Views>({
		explorer: false,
		connectionManager: true,
	});

	const switchViews = useCallback(
		(view: keyof Views) => {
			if (!currentView[view]) {
				const viewDetails = (
					Object.keys(currentView) as Array<keyof Views>
				).reduce<Views>(
					(acc, key) => ((acc[key] = key === view ? true : false), acc),
					currentView
				);

				setCurrentView({
					...viewDetails,
				});
			}
		},
		[currentView]
	);

	useEffect(
		() =>
			listenEffect([
				{
					event: "home:toggle_view",
					cb: (e, payload) => switchViews(payload),
				},
			]),
		[switchViews]
	);

	return (
		<div className="App">
			<PageHeader />
			<PageBody>
				<SideBar />
				<Explorer open={currentView.explorer} />
				<ConnectionManager open={currentView.connectionManager} />
				<Browser />
			</PageBody>
		</div>
	);
}

export default App;
