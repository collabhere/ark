import { ButtonGroup, Code, FormGroup, InputGroup } from "@blueprintjs/core";
import React from "react";
import { Button } from "../../../../common/components/Button";

interface BasicConnectionFormProps {
	currentName: string;
	onNameChange(name: string): void;
	currentUri: string;
	onUriChange(uri: string): void;
	onFormTypeChange(type: "advanced"): void;
	onTestConnection(): void;
	onSaveConnection(): void;
}

export const BasicConnectionForm = (props: BasicConnectionFormProps) => {
	const { currentName, currentUri, onFormTypeChange, onNameChange, onUriChange, onTestConnection, onSaveConnection } =
		props;

	return (
		<div className="basic-wrapper">
			<div className="form">
				<FormGroup label="Name" labelFor="connection-name-basic">
					<InputGroup id="connection-name-basic" value={currentName} onChange={(e) => onNameChange(e.target.value)} />
				</FormGroup>
				<FormGroup
					helperText={
						<span>
							{"Enter a URI starting with "}
							<Code>{"mongodb://"}</Code>
							{" or "}
							<Code>{"mongodb+srv://"}</Code>
						</span>
					}
					label="URI"
					labelFor="uri"
				>
					<InputGroup id="uri" onChange={(e) => onUriChange(e.target.value)} value={currentUri} />
				</FormGroup>
				<div className="button-row">
					<Button text="Advanced Settings" variant="link" onClick={() => onFormTypeChange("advanced")} />
					<ButtonGroup className="button-group">
						<Button text="Test" variant="link" onClick={() => onTestConnection()} />
						<Button text="Save" variant="primary" onClick={() => onSaveConnection()} />
					</ButtonGroup>
				</div>
			</div>
		</div>
	);
};
