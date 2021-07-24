import "./shell.less";

import React, { useCallback, useState } from "react";

import Editor from "@monaco-editor/react";
import { KeyMod, KeyCode, editor } from "monaco-editor";
import { registerCompletions } from "./completions";
import { Resizable } from "re-resizable";

const DEFAULT_CODE = `// Mongo shell
db.getCollection('test').find({});
`;

interface ExecutionResult {
	data: any[];
}

interface ShellProps {
	collections: string[];
	onExecutionResult?: (result: ExecutionResult) => void;
}
export default function Shell(props: ShellProps) {
	const { collections, onExecutionResult: onExecutionResult } = props;

	const [code, setCode] = useState(DEFAULT_CODE);

	const exec = useCallback(() => {
		onExecutionResult &&
			onExecutionResult({
				data: [],
			});
	}, []);

	return (
		<div className={"Shell"}>
			<Resizable
				minHeight={"10%"}
				maxHeight={"40%"}
				defaultSize={{ height: "10%", width: "100%" }}
			>
				<Editor
					options={{
						minimap: {
							enabled: false,
						},
					}}
					theme={"ark"}
					beforeMount={(monaco) => {
						registerCompletions(monaco, { collections });
						monaco.editor.defineTheme("ark", {
							base: "vs-dark",
							inherit: true,
							rules: [],
							colors: {
								"editor.foreground": "#000000",
								"editor.background": "#060a21",
								"editorCursor.foreground": "#8B0000",
								"editor.lineHighlightBackground": "#0000FF20",
								"editor.selectionBackground": "#8B0000",
								"editor.inactiveSelectionBackground": "#88000015",
							},
						});
					}}
					onMount={(editor, monaco) => {
						editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, exec);
					}}
					onChange={(value, ev) => {
						value && setCode(value);
					}}
					height="100%"
					defaultValue={code}
					defaultLanguage="javascript"
				/>
			</Resizable>
		</div>
	);
}
