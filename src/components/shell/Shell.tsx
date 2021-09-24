import "./shell.less";

import React, { FC, useCallback, useEffect, useState } from "react";
import { deserialize } from "bson";
import { default as Monaco } from "@monaco-editor/react";
import { KeyMod, KeyCode, editor } from "monaco-editor";
import { mountMonaco } from "./monaco";

const createDefaultCodeSnippet = (collection: string) => `// Mongo shell
db.getCollection('${collection}').find({});
`;

export enum MONACO_COMMANDS {
	CLONE_SHELL,
}

interface ExecutionResult {
	data: Ark.AnyObject;
}

export interface ShellProps {
	allCollections: string[];
	config: {
		uri: string;
		collection: string;
	};
	contextDB: string;
	onExecutionResult?: (result: ExecutionResult) => void;
	onShellMessage?: (message: string) => void;
	onMonacoCommand?: (command: MONACO_COMMANDS) => void;
}
export const Shell: FC<ShellProps> = (props) => {
	const {
		allCollections,
		onExecutionResult,
		config,
		contextDB,
		onShellMessage,
		onMonacoCommand,
	} = props;

	const { collection, uri } = config;

	const [code, setCode] = useState(() =>
		collection
			? createDefaultCodeSnippet(collection)
			: createDefaultCodeSnippet("test")
	);
	const [monacoEditor, setMonacoEditor] =
		useState<editor.IStandaloneCodeEditor>();
	const [shellId, setShellId] = useState<string>();

	const exec = useCallback(() => {
		const _code = code.replace(/(\/\/.*)|(\n)/g, "");
		shellId &&
			window.ark.shell
				.eval(shellId, _code)
				.then(function ({ result, err }) {
					if (err) {
						onShellMessage && onShellMessage(err.message);
						return console.error("exec shell error", err);
					}
					onExecutionResult &&
						onExecutionResult({
							data: Object.values(
								deserialize(result ? result : Buffer.from([]))
							),
						});
				})
				.catch(function (err) {
					console.error("exec shell error: ", err);
				});
	}, [code, onExecutionResult, onShellMessage, shellId]);

	const cloneCurrentTab = useCallback(() => {
		onMonacoCommand && onMonacoCommand(MONACO_COMMANDS.CLONE_SHELL);
	}, [onMonacoCommand]);

	useEffect(() => {
		if (monacoEditor) {
			monacoEditor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, exec);
			monacoEditor.addCommand(
				KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_N,
				cloneCurrentTab
			);
		}
	}, [cloneCurrentTab, exec, monacoEditor]);

	useEffect(() => {
		console.log("Context ", contextDB);
		console.log("URI", uri);
		contextDB &&
			window.ark.shell.create(uri, contextDB).then(function ({ id }) {
				setShellId(id);
			});
	}, [contextDB, uri]);

	return (
		<div className={"Shell"}>
			<Monaco
				options={{
					minimap: {
						enabled: false,
					},
				}}
				theme={"ark"}
				beforeMount={(monaco) => {
					mountMonaco(monaco, { collections: allCollections });
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
				onMount={(editor: editor.IStandaloneCodeEditor) => {
					setMonacoEditor(editor);
				}}
				onChange={(value, ev) => {
					value && setCode(value);
				}}
				height="100%"
				defaultValue={code}
				defaultLanguage="typescript"
			/>
		</div>
	);
};
