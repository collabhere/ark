import "./styles.less";

import React, { FC, useCallback, useEffect, useState } from "react";
import Monaco from "@monaco-editor/react";
import { KeyMod, KeyCode, editor } from "monaco-editor";
import { mountMonaco } from "./monaco";
import { Button } from "../../common/components/Button";

export enum MONACO_COMMANDS {
	CLONE_SHELL,
	EXEC_CODE,
}

export interface ShellProps {
	allCollections: string[];
	initialCode: string;
	onMonacoCommand?: (command: MONACO_COMMANDS, params?: any) => void;
	onExport?: (params?: any) => void;
}
export const Shell: FC<ShellProps> = (props) => {
	const { allCollections, onMonacoCommand, initialCode, onExport } = props;

	const [code, setCode] = useState(initialCode);

	const [monacoEditor, setMonacoEditor] =
		useState<editor.IStandaloneCodeEditor>();

	const exec = useCallback(() => {
		const _code = code.replace(/(\/\/.*)|(\n)/g, "");
		onMonacoCommand &&
			onMonacoCommand(MONACO_COMMANDS.EXEC_CODE, { code: _code });
	}, [code, onMonacoCommand]);

	const exportData = useCallback(() => {
		const _code = code.replace(/(\/\/.*)|(\n)/g, "");
		onExport && onExport({ code: _code });
	}, [code, onExport]);

	const cloneCurrentTab = useCallback(() => {
		onMonacoCommand && onMonacoCommand(MONACO_COMMANDS.CLONE_SHELL);
	}, [onMonacoCommand]);

	useEffect(() => {
		setCode(initialCode);
	}, [initialCode]);

	useEffect(() => {
		if (monacoEditor) {
			monacoEditor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, exec);
			monacoEditor.addCommand(
				KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_N,
				cloneCurrentTab
			);
		}
	}, [cloneCurrentTab, exec, monacoEditor]);

	return (
		<div className={"Shell"}>
			<Button text="Export" onClick={exportData} />
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
