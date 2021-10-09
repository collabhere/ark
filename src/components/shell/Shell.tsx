import "./styles.less";

import React, { FC, useCallback, useEffect, useState } from "react";
import Monaco from "@monaco-editor/react";
import { KeyMod, KeyCode, editor } from "monaco-editor";
import { mountMonaco } from "./monaco";
import { Button } from "../../common/components/Button";
import { Dialog } from "../../common/components/Dialog";
import { Input, Radio, Switch } from "antd";
import TextArea from "antd/lib/input/TextArea";

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

	const [exportDialog, toggleExportDialog] = useState<boolean>(false);

	const [exportOptions, setExportOptions] = useState<
		Ark.ExportNdjsonOptions | Ark.ExportCsvOptions
	>({
		type: "NDJSON",
		fileName: "",
	});

	const exec = useCallback(() => {
		const _code = code.replace(/(\/\/.*)|(\n)/g, "");
		onMonacoCommand &&
			onMonacoCommand(MONACO_COMMANDS.EXEC_CODE, { code: _code });
	}, [code, onMonacoCommand]);

	const exportData = useCallback(() => {
		const _code = code.replace(/(\/\/.*)|(\n)/g, "");
		onExport && onExport({ code: _code, options: exportOptions });
		toggleExportDialog(false);
		setExportOptions({
			type: "NDJSON",
			fileName: "",
		});
	}, [code, exportOptions, onExport]);

	const changeExportOptions = useCallback(
		(option: "fields" | "destructure" | "type" | "fileName", e?: any) => {
			if (option === "type") {
				if (e.target.value === "CSV") {
					setExportOptions((options) => ({
						...options,
						type: "CSV",
						destructureData: false,
						fields: [],
					}));
				} else if (e.target.value === "NDJSON") {
					setExportOptions((options) => ({
						fileName: options.fileName,
						type: "NDJSON",
					}));
				}
			} else if (option === "destructure") {
				setExportOptions((options) => ({
					...options,
					destructureData:
						options.type === "CSV" ? !options.destructureData : false,
				}));
			} else if (option === "fileName") {
				setExportOptions((options) => ({
					...options,
					fileName: e.target.value,
				}));
			} else {
				setExportOptions((options) => ({
					...options,
					fields:
						options.type === "CSV"
							? e.target.value.split(",").map((field) => field.trim())
							: undefined,
				}));
			}
		},
		[]
	);

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
			<Button text="Export" onClick={() => toggleExportDialog(true)} />
			{exportDialog && (
				<Dialog
					size={"small"}
					title={"Export Query Result"}
					onConfirm={exportData}
					onCancel={() => toggleExportDialog(false)}
				>
					<div className={"export-options"}>
						<div className={"export-type"}>
							<div>
								<span>Export as: </span>
							</div>
							<div>
								<Radio.Group
									options={["CSV", "NDJSON"]}
									value={exportOptions.type}
									buttonStyle={"solid"}
									onChange={(e) => {
										changeExportOptions("type", e);
									}}
								/>
							</div>
						</div>
						<div className={"export-type"}>
							<div>
								<span>File name: </span>
							</div>
							<div>
								<Input
									value={exportOptions.fileName}
									onChange={(e) => changeExportOptions("fileName", e)}
								/>
							</div>
						</div>
						{exportOptions.type === "CSV" && (
							<div>
								<div className={"export-suboptions"}>
									<div>
										<span>Destructure data: </span>
									</div>
									<div>
										<Switch
											checked={!!exportOptions.destructureData}
											onChange={() => changeExportOptions("destructure")}
										/>
									</div>
								</div>
								<div>
									<div>
										<span>Fields: </span>
									</div>
									<div>
										<TextArea
											value={exportOptions.fields?.join(",")}
											onChange={(e) => changeExportOptions("fields", e)}
										/>
									</div>
								</div>
							</div>
						)}
					</div>
				</Dialog>
			)}
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
