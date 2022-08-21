import { ButtonGroup } from "@blueprintjs/core";
import React, { useState } from "react";
import { EditConnectionMethod } from "..";
import { Button } from "../../../../common/components/Button";
import { EventOverloadMethod } from "../../../../common/utils/misc";
import { FormSectionAuthentication } from "./advanced-form-sections/FormSectionAuthentication";
import { FormSectionConnection } from "./advanced-form-sections/FormSectionConnection";
import { FormSectionMisc } from "./advanced-form-sections/FormSectionMisc";
import { FormSectionSSH } from "./advanced-form-sections/FormSectionSSH";
import { FormSectionTLS } from "./advanced-form-sections/FormSectionTLS";

export interface AdvancedConnectionFormProps {
	connectionData: Ark.StoredConnection;
	editConnection: EditConnectionMethod;
	icon?: Ark.StoredIcon;
	onIconChange(icon: Ark.StoredIcon): void;
	onFormTypeChange(type: "basic"): void;
	onTestConnection: EventOverloadMethod;
	onSaveConnection: EventOverloadMethod;
}

export const AdvancedConnectionForm = (props: AdvancedConnectionFormProps) => {
	const { onFormTypeChange, onSaveConnection, onTestConnection } = props;

	const [form, setForm] = useState<"connection" | "authentication" | "ssh" | "tls" | "misc">("connection");

	return (
		<div className="advanced-wrapper">
			<div className="header">
				<div className="section-header">
					<Button
						text="Connection"
						variant="link"
						active={form === "connection"}
						onClick={() => setForm("connection")}
					/>
				</div>
				<div className="section-header">
					<Button
						text="Authentication"
						variant="link"
						active={form === "authentication"}
						onClick={() => setForm("authentication")}
					/>
				</div>
				<div className="section-header">
					<Button text="SSH" variant="link" active={form === "ssh"} onClick={() => setForm("ssh")} />
				</div>
				<div className="section-header">
					<Button text="TLS" variant="link" active={form === "tls"} onClick={() => setForm("tls")} />
				</div>
				<div className="section-header">
					<Button text="Misc" variant="link" active={form === "misc"} onClick={() => setForm("misc")} />
				</div>
			</div>
			{form === "connection" && <FormSectionConnection {...props} />}
			{form === "authentication" && <FormSectionAuthentication {...props} />}
			{form === "ssh" && <FormSectionSSH {...props} />}
			{form === "tls" && <FormSectionTLS {...props} />}
			{form === "misc" && <FormSectionMisc {...props} />}
			{
				<div className="advanced-footer-row">
					<ButtonGroup className="button-group">
						<Button text="Back" variant="link" onClick={() => onFormTypeChange("basic")} />
					</ButtonGroup>
					<ButtonGroup className="button-group">
						<Button text="Test" variant="link" onClick={onTestConnection} />
						<Button text="Save" variant="primary" onClick={onSaveConnection} />
					</ButtonGroup>
				</div>
			}
		</div>
	);
};
