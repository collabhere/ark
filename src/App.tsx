import React, { useState, useEffect, FC } from "react";
import "./App.less";
import { Browser } from "./components/browser/Browser";
import { Explorer } from "./components/explorer/Explorer";
import { PageBody } from "./components/layout/PageBody";

import { PageHeader } from "./components/layout/PageHeader";
import { ConnectionManager } from "./components/connection-manager/ConnectionManager";
import { Sidebar } from "./components/sidebar/Sidebar";
import { Hotkeys } from "./common/components/Hotkeys";

interface SettingsContextType {
	settings?: Ark.Settings;
	setSettings?: React.Dispatch<React.SetStateAction<Ark.Settings>>;
}

export const SettingsContext = React.createContext<SettingsContextType>({});

const App: FC = () => {
	const [enableHotkeys, setEnableHotkeys] = useState(true);

	const [settings, setSettings] = useState({});

	// App load effect
	useEffect(() => {}, []);

	useEffect(() => {
		window.ark.settings
			.fetch("general")
			.then((settings) => {
				if (settings) {
					setSettings(settings);
				}
			})
			.catch((err) => {
				console.log("Settings context error:", err);
			});
	}, []);

	return (
		<div className="App">
			{settings && (
				<SettingsContext.Provider value={{ settings, setSettings }}>
					{enableHotkeys && <Hotkeys />}
					<PageHeader />
					<PageBody>
						<Sidebar />
						<Explorer />
						<ConnectionManager />
						<Browser />
					</PageBody>
				</SettingsContext.Provider>
			)}
		</div>
	);
};

export default App;
