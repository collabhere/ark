import "./styles.less";
import {
	FileInput,
	FormGroup,
	InputGroup,
	Radio,
	RadioGroup,
	Switch,
	TextArea,
} from "@blueprintjs/core";
import React, { FC, useCallback, useState } from "react";
import { Dialog } from "../../common/components/Dialog";
import { notify } from "../../common/utils/misc";

interface ExportQueryResultProps {
	onExport: (
		exportOptions: Ark.ExportNdjsonOptions | Ark.ExportCsvOptions
	) => void;
	onCancel: () => void;
}

const defaultFileName = () => `query-export-${new Date().toISOString()}.ndjson`;

export const ExportQueryResult: FC<ExportQueryResultProps> = (props) => {
	const { onExport, onCancel } = props;

	const [exportOptions, setExportOptions] = useState<
		Ark.ExportNdjsonOptions | Ark.ExportCsvOptions
	>({
		type: "NDJSON",
		saveLocation: "",
		fileName: defaultFileName(),
	});

	const validateExportOptions = useCallback(() => {
		if (!exportOptions.saveLocation) {
			return { ok: false, err: "Please set a save location." };
		}
		if (!exportOptions.fileName) {
			return { ok: false, err: "Please set a file name." };
		}
		return { ok: true };
	}, [exportOptions.saveLocation, exportOptions.fileName]);

	const changeExportOptions = useCallback(
		(
			option: "fields" | "type" | "saveLocation" | "fileName",
			value?: string
		) => {
			if (option === "type") {
				if (value === "CSV") {
					setExportOptions((options) => ({
						...options,
						type: "CSV",
						fileName: options.fileName.replace(/\.ndjson$/i, ".csv"),
						fields: [],
					}));
				} else if (value === "NDJSON") {
					setExportOptions((options) => ({
						saveLocation: options.saveLocation,
						fileName: options.fileName.replace(/\.csv$/i, ".ndjson"),
						type: "NDJSON",
					}));
				}
			} else if (option === "saveLocation" && typeof value !== "undefined") {
				setExportOptions((options) => ({
					...options,
					saveLocation: value,
				}));
			} else if (option === "fileName" && typeof value !== "undefined") {
				setExportOptions((options) => ({
					...options,
					fileName: value,
				}));
			} else {
				setExportOptions((options) => ({
					...options,
					fields:
						options.type === "CSV"
							? value?.split(",").map((field) => field.trim())
							: undefined,
				}));
			}
		},
		[]
	);

	return (
		<Dialog
			size={"small"}
			title={"Start Export"}
			onConfirm={() => {
				const { ok, err } = validateExportOptions();
				if (ok) {
					onExport(exportOptions);
					setExportOptions({
						type: "NDJSON",
						saveLocation: "",
						fileName: "",
					});
				} else {
					notify({
						type: "error",
						title: "Export Error",
						description: err ? err : "",
					});
				}
			}}
			onCancel={() => onCancel()}
		>
			<div className={"export-options"}>
				<div className={"export-type"}>
					<RadioGroup
						label="Export as"
						selectedValue={exportOptions.type}
						onChange={(e) => {
							changeExportOptions("type", (e.target as any).value);
						}}
					>
						<Radio label="CSV" value="CSV" />
						<Radio label="NDJSON" value="NDJSON" />
					</RadioGroup>
				</div>
				<div className={"export-type"}>
					<FormGroup label="Output Destination">
						<FileInput
							fill
							text={
								exportOptions.saveLocation
									? exportOptions.saveLocation
									: "Choose a destination..."
							}
							onClick={(e) => {
								e.preventDefault();
								return window.ark
									.browseForDirs("Select A Save Location", "Set")
									.then((result) => {
										const { dirs } = result;
										const saveLocation = dirs[dirs.length - 1];
										changeExportOptions("saveLocation", saveLocation);
									});
							}}
						/>
					</FormGroup>
				</div>
				<FormGroup label="File Name">
					<InputGroup
						fill
						value={exportOptions.fileName}
						onChange={(e) => changeExportOptions("fileName", e.target.value)}
					/>
				</FormGroup>
				{exportOptions.type === "CSV" && (
					<div className="export-type">
						<FormGroup
							helperText="Provide comma separated fields from the query result to use as headers of the CSV. You can use '.' (dot) notiation to display subdocument keys and array elements."
							label="Fields"
						>
							<TextArea
								fill
								value={exportOptions.fields?.join(",")}
								onChange={(e) => changeExportOptions("fields", e.target.value)}
							/>
						</FormGroup>
					</div>
				)}
			</div>
		</Dialog>
	);
};
