import "./styles.less";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import Monaco from "@monaco-editor/react";
import { KeyMod, KeyCode, editor } from "monaco-editor";
import { mountMonaco } from "./monaco";

export enum MONACO_COMMANDS {
	CLONE_SHELL,
	EXEC_CODE,
}

export interface ShellProps {
	allCollections: string[];
	code: string;
	settings: Ark.Settings | undefined;
	onCodeChange: (code: string) => void;
	onMonacoCommand?: (command: MONACO_COMMANDS) => void;
}
export const Shell: FC<ShellProps> = (props) => {
	const { allCollections, onMonacoCommand, code, onCodeChange, settings } =
		props;

	const [monacoEditor, setMonacoEditor] =
		useState<editor.IStandaloneCodeEditor>();

	const exec = useCallback(() => {
		onMonacoCommand && onMonacoCommand(MONACO_COMMANDS.EXEC_CODE);
	}, [onMonacoCommand]);

	const cloneCurrentTab = useCallback(() => {
		onMonacoCommand && onMonacoCommand(MONACO_COMMANDS.CLONE_SHELL);
	}, [onMonacoCommand]);

	const keyBindings = useMemo(
		() => [
			{
				key: KeyMod.CtrlCmd | KeyCode.Enter,
				command: exec,
			},
			{
				key: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_N,
				command: cloneCurrentTab,
			},
		],
		[cloneCurrentTab, exec]
	);

	useEffect(() => {
		if (monacoEditor) {
			if (settings?.hotKeys === "off") {
				keyBindings.forEach((binding) =>
					monacoEditor.addCommand(binding.key, () => {})
				);
			} else {
				keyBindings.forEach((binding) =>
					monacoEditor.addCommand(binding.key, binding.command)
				);
			}
		}
	}, [cloneCurrentTab, exec, keyBindings, monacoEditor, settings?.hotKeys]);

	return (
		<div className={"Shell"}>
			<Monaco
				options={{
					lineNumbers: settings?.lineNumbers === "off" ? "off" : "on",
					minimap: {
						enabled: settings?.miniMap === "on" ? true : false,
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
					value && onCodeChange(value);
				}}
				height="100%"
				defaultValue={code}
				defaultLanguage="typescript"
			/>
		</div>
	);
};
