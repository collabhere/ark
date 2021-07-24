import React from "react";
import { Resizable } from "re-resizable";
import "./App.less";

import Shell from "./components/shell/Shell";
import Explorer from "./components/explorer/Explorer";

function App() {
	return (
		<div className="App">
			<Resizable
				defaultSize={{
					width: "25%",
					height: "100%",
				}}
			>
				<Explorer />
			</Resizable>
			<Resizable
				defaultSize={{
					width: "75%",
					height: "100%",
				}}
			>
				<Shell
					onExecute={(code) => {
						console.log("Code to be executed:");
						console.log(code);
						window.ark.api.ping();
					}}
					collections={["test_collection_list_1", "test_collection_list_2"]}
				/>
			</Resizable>
		</div>
	);
}

export default App;
