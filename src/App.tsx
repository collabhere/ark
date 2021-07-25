import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.less";
import { Explorer } from "./components/explorer/Explorer";

import { PageBody } from "./components/layout/PageBody";
import { PageHeader } from "./components/layout/PageHeader";

function App() {
	const [explorerConnection, setExplorerConnection] = useState<string>();

	// App load effect
	useEffect(() => {
		// window.ark.
	}, []);
1;
	return (
		<div className="App">
			<PageHeader />
			<PageBody>
				{explorerConnection && <Explorer connectionId={explorerConnection} />}
			</PageBody>
		</div>
	);
}

export default App;
