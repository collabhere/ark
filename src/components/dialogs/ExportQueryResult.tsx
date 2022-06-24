import "./styles.less";
import {
	FileInput,
	FormGroup,
	Radio,
	RadioGroup,
	Switch,
	TextArea,
} from "@blueprintjs/core";
import React, { FC, useCallback, useState } from "react";
import { Dialog } from "../../common/components/Dialog";

interface ExportQueryResultProps {
	onExport: (
		exportOptions: Ark.ExportNdjsonOptions | Ark.ExportCsvOptions
	) => void;
	onCancel: () => void;
}

export const ExportQueryResult: FC<ExportQueryResultProps> = (props) => {
	const { onExport, onCancel } = props;
	const [exportOptions, setExportOptions] = useState<
		Ark.ExportNdjsonOptions | Ark.ExportCsvOptions
	>({
		type: "NDJSON",
		fileName: "",
	});

	const changeExportOptions = useCallback(
		(
			option: "fields" | "destructure" | "type" | "fileName",
			value?: string
		) => {
			if (option === "type") {
				if (value === "CSV") {
					setExportOptions((options) => ({
						...options,
						type: "CSV",
						destructureData: false,
						fields: [],
					}));
				} else if (value === "NDJSON") {
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
			} else if (option === "fileName" && value) {
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
			title={"Setup Export"}
			onConfirm={() => {
				onExport(exportOptions);
				setExportOptions({
					type: "NDJSON",
					fileName: "",
				});
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
								exportOptions.fileName
									? exportOptions.fileName
									: "Choose a destination..."
							}
							onClick={(e) => {
								e.preventDefault();
								return window.ark
									.browseForDirs("Select A Save Location", "Set")
									.then((result) => {
										const { dirs } = result;
										const saveLocation = dirs[dirs.length - 1];
										changeExportOptions("fileName", saveLocation);
									});
							}}
						/>
					</FormGroup>
				</div>
				{exportOptions.type === "CSV" && (
					<div className="export-type">
						<FormGroup
							helperText="Enabling this will add headers for objects and arrays. These headers will be the paths to the respective keys."
							labelFor="destructure-switch"
						>
							<Switch
								inline
								label="Destructure objects and arrays"
								id="destructure-switch"
								checked={!!exportOptions.destructureData}
								onChange={() => changeExportOptions("destructure")}
							/>
						</FormGroup>
						<FormGroup
							helperText="Provide comma separated fields from the query result to use as headers of the CSV."
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
