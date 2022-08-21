import { FormGroup } from "@blueprintjs/core";
import React, { FC } from "react";
import { FileInput } from "../../../../../common/components/FileInput";
import { notify } from "../../../../../common/utils/misc";
import { AdvancedConnectionFormProps } from "../AdvancedConnectionForm";

export const FormSectionMisc: FC<AdvancedConnectionFormProps> = (props) => {
	const { icon, onIconChange: setIcon } = props;

	return (
		<div className="form">
			<div className="flex-inline">
				<FormGroup
					label="Icon"
					helperText={"This icon will be used in the sidebar. Ark will copy the icon to it's own location."}
				>
					<FileInput
						fill
						accept={["image/png", "image/svg", "image/jpeg"]}
						text={icon && icon.path ? icon.path : "Choose an image..."}
						onFileChange={(list) => {
							const file = list?.item(0);
							if (file) {
								if (file.type !== "image/png" && file.type !== "image/svg" && file.type !== "image/jpeg") {
									notify({
										title: "Validation failed",
										type: "error",
										description: "Only PNG, SVG, and JPEG types are supported!",
									});
								} else {
									let rmIconIfRequired = Promise.resolve();
									if (icon && icon.name) {
										rmIconIfRequired = window.ark.rmIcon(icon.path);
									}
									rmIconIfRequired
										.then(() => window.ark.copyIcon("icons", file.name, (file as any).path))
										.then((result) => {
											const { path } = result;
											setIcon({
												path,
												type: file.type,
												name: file.name,
												size: file.size,
												lastModified: file.lastModified,
											});
										});
								}
							}
						}}
					/>
				</FormGroup>
				<div className="connection-form-icon">
					{icon ? <img src={`ark://icons/${icon.name}`} width={30} height={30} /> : <span>No Icon</span>}
				</div>
			</div>
		</div>
	);
};
