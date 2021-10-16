import { Input, Radio, Switch } from "antd";
import TextArea from "antd/lib/input/TextArea";
import React, { FC, useCallback, useState } from "react";
import {
	VscThreeBars,
	VscJson,
	VscArrowUp,
	VscTextSize,
} from "react-icons/vsc";
import { Button } from "../../../../common/components/Button";
import { Dialog } from "../../../../common/components/Dialog";
import "../../styles.less";
import "../../../../common/styles/layout.less";

export interface TreeViewerProps {
	json: Ark.AnyObject;
}

const TreeViewer: FC<TreeViewerProps> = (props) => {
	const { json } = props;
	return <div></div>;
};

export interface TextViewerProps {
	text: string | React.ReactNode;
}
const TextViewer: FC<TextViewerProps> = (props) => {
	const { text } = props;
	return typeof text == "string" ? (
		<div dangerouslySetInnerHTML={{ __html: text }}></div>
	) : (
		<div>{text}</div>
	);
};

interface JSONViewerProps {
	json: Ark.AnyObject;
}

const JSONViewer: FC<JSONViewerProps> = (props) => {
	const { json } = props;
	return (
		<>
			{Array.isArray(json) ? (
				json.map((doc, i) => (
					<div key={i}>
						<div>{"// " + (i + 1)}</div>
						<div>{JSON.stringify(doc, null, 4)}</div>
						<br />
					</div>
				))
			) : (
				<div>{JSON.stringify(json, null, 4)}</div>
			)}
		</>
	);
};

export type ResultViewerProps = (
	| { type: "json"; json: Ark.AnyObject }
	| { type: "text"; text: string | React.ReactNode }
	| { type: "tree"; tree: Ark.AnyObject }
) & { code?: string; onExport?: (params?: any) => void };

export const ResultViewer: FC<ResultViewerProps> = (props) => {
	const { code, type, onExport } = props;
	const [exportDialog, toggleExportDialog] = useState<boolean>(false);
	const [exportOptions, setExportOptions] = useState<
		Ark.ExportNdjsonOptions | Ark.ExportCsvOptions
	>({
		type: "NDJSON",
		fileName: "",
	});

	const exportData = useCallback(() => {
		onExport && onExport({ code, options: exportOptions });
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

	return (
		<>
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
			<div className="flex-block padding-min">
				<div className="flex-inline-end">
					<div>
						<span>
							<Button icon={<VscJson color={"#fff"} />} />
						</span>
					</div>
					<div>
						<Button icon={<VscTextSize color={"#fff"} />} />
					</div>
					<div>
						<span>
							<Button icon={<VscThreeBars color={"#fff"} />} />
						</span>
					</div>
					<div>
						<Button
							icon={<VscArrowUp color={"#fff"} />}
							onClick={() => toggleExportDialog(true)}
							popoverOptions={{ hover: { content: "Export data" } }}
						/>
					</div>
				</div>
				<div className="resultviewer-container">
					{type === "json" ? (
						<JSONViewer json={props[type]} />
					) : type === "text" ? (
						<TextViewer text={props[type]} />
					) : type === "tree" ? (
						<TreeViewer json={props[type]} />
					) : (
						<div>{"Incorrect view type!"}</div>
					)}
				</div>
			</div>
		</>
	);
};
