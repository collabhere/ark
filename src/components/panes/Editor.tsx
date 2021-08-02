import React, { useState } from "react";
import "./panes.less";
import Shell, { ShellProps } from "../shell/Shell";
import { Resizable } from "re-resizable";

export interface EditorProps {
	shellConfig: ShellProps["shellConfig"];
}

interface JSONViewerProps {
	json: any;
}

function JSONViewer(props: JSONViewerProps): JSX.Element {
	const { json } = props;
	return (
		<div className="JSONViewer">
			<pre>{JSON.stringify(json, null, 2)}</pre>
		</div>
	);
}

export function Editor(props: EditorProps): JSX.Element {
	const { shellConfig } = props;

	const [currentResult, setCurrentResult] = useState<any>();

	return (
		<div className={"Editor"}>
			<Resizable
				// minHeight={"20%"}
				maxHeight={"40%"}
				defaultSize={{ height: "20%", width: "100%" }}
				enable={{ bottom: true }}
			>
				<Shell
					shellConfig={shellConfig}
					collections={["test_collection_1"]}
					onExecutionResult={(result) => setCurrentResult(result)}
				/>
			</Resizable>
			{currentResult && <JSONViewer json={currentResult} />}
		</div>
	);
}
