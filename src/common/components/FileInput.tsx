import "../styles/variables.less";

import { FileInput as BPFileInput } from "@blueprintjs/core";
import React, { FC } from "react";
import { notify } from "../utils/misc";

interface FileInputProps {
	text: string;
	fill?: boolean;
	accept?: string[];
	disabled?: boolean;
	onFileChange?: (list: FileList) => void;
}

export const FileInput: FC<FileInputProps> = (props) => {
	const { onFileChange, text, accept, fill, disabled } = props;

	return (
		<div className="file-input-container">
			<BPFileInput
				fill={fill}
				text={text}
				disabled={disabled}
				inputProps={{
					accept: accept ? accept.join(",") : undefined,
				}}
				onInputChange={(e) => {
					const list = e.currentTarget.files;
					if (list) {
						onFileChange && onFileChange(list);
					} else {
						notify({
							description: "No files were selected.",
							type: "warning",
						});
					}
				}}
			/>
		</div>
	);
};
