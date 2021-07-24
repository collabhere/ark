import React, { useCallback, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { KeyMod, KeyCode } from "monaco-editor";
import { registerCompletions } from "./completions";

const DEFAULT_CODE = `// Mongo shell
db.getCollection('masteruserdetails').find({});
`;

interface ShellProps {
	collections: string[];
	onExecute?: (code: string) => void;
}
export default function Shell(props: ShellProps) {
	const { collections, onExecute } = props;

	const [code, setCode] = useState(DEFAULT_CODE);

	const exec = useCallback(() => onExecute && onExecute(code), []);

	return (
		<Editor
			beforeMount={(monaco) => {
				registerCompletions(monaco, { collections });
			}}
			onMount={(editor, monaco) => {
				editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, exec);
				// ipcRenderer.send("anything-asynchronous", "ping");
			}}
			onChange={(value, ev) => {
				value && setCode(value);
			}}
			height="100%"
			defaultValue={code}
			defaultLanguage="javascript"
		/>
	);
}
