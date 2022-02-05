import { Input, Radio, Switch } from "antd";
import TextArea from "antd/lib/input/TextArea";
import React, { FC, useCallback, useState } from "react";
import { VscArrowUp, VscListTree, VscJson } from "react-icons/vsc";
import { Button } from "../../../../common/components/Button";
import { Dialog } from "../../../../common/components/Dialog";
import "../../styles.less";
import "../../../../common/styles/layout.less";
import "./styles.less";
import { TreeViewer } from "./TreeViewer";
import { JSONViewer } from "./JSONViewer";

export type ResultViewerProps = {
	type: "json" | "tree";
	bson: Ark.BSONArray;
} & {
	code?: string;
	onExport?: (params?: any) => void;
	switchViews?: (type: "tree" | "json") => void;
};

export const ResultViewer: FC<ResultViewerProps> = (props) => {
	const { code, type, onExport, switchViews } = props;
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
			<div className="ResultViewer">
				<div className="flex-inline-end">
					<div>
						<span>
							<Button
								size="large"
								icon={<VscListTree color={"#fff"} />}
								onClick={() => switchViews && switchViews("tree")}
								popoverOptions={{
									hover: { content: "Switch to Tree View" },
								}}
							/>
						</span>
					</div>
					<div>
						<span>
							<Button
								size="small"
								icon={<VscJson color={"#fff"} />}
								onClick={() => switchViews && switchViews("json")}
								popoverOptions={{
									hover: { content: "Switch to JSON View" },
								}}
							/>
						</span>
					</div>
					<div>
						<Button
							size="small"
							icon={<VscArrowUp color={"#fff"} />}
							onClick={() => toggleExportDialog(true)}
							popoverOptions={{ hover: { content: "Export data" } }}
						/>
					</div>
				</div>
				<div className="resultviewer-container">
					{type === "json" ? (
						<JSONViewer bson={props.bson} />
					) : type === "tree" ? (
						<TreeViewer bson={props.bson} />
					) : (
						<div>{"Incorrect view type!"}</div>
					)}
				</div>
			</div>
			{/* Dialogs */}
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
			</>
		</>
	);
};
