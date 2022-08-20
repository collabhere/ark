import { FormGroup, InputGroup } from "@blueprintjs/core";
import React, { FC } from "react";
import { Button } from "../../../../../common/components/Button";
import { createDropdownMenu } from "../../../../../common/components/DropdownMenu";
import { AdvancedConnectionFormProps } from "../AdvancedConnectionForm";

export const FormSectionAuthentication: FC<AdvancedConnectionFormProps> = (props) => {

	const {
		connectionData,
		editConnection
	} = props;


	const authMechanismMenu = createDropdownMenu([
		{
			onClick: () =>
				editConnection("options", {
					...connectionData.options,
					authMechanism: "SCRAM-SHA-1",
				}),

			key: "SCRAM-SHA-1",
			text: "SCRAM-SHA-1",
		},
		{
			onClick: () =>
				editConnection("options", {
					...connectionData.options,
					authMechanism: "SCRAM-SHA-256",
				}),
			key: "SCRAM-SHA-256",
			text: "SCRAM-SHA-256",
		},
	]);

	return <div className="form">
		<FormGroup
			label="Database"
			helperText="Authentication database name"
		>
			<div className="input-field">
				<InputGroup
					value={connectionData?.database}
					onChange={(e) =>
						editConnection("database", e.target.value)
					}
				/>
			</div>
		</FormGroup>
		<FormGroup label="Username">
			<div className="input-field">
				<InputGroup
					value={connectionData?.username}
					onChange={(e) =>
						editConnection("username", e.target.value)
					}
				/>
			</div>
		</FormGroup>
		<FormGroup label="Password">
			<div className="input-field">
				<InputGroup
					type="password"
					value={connectionData?.password}
					onChange={(e) =>
						editConnection("password", e.target.value)
					}
				/>
			</div>
		</FormGroup>
		<FormGroup label="Authentication Mechanism">
			<div className="input-field">
				<Button
					size="small"
					rightIcon="caret-down"
					dropdownOptions={{
						content: authMechanismMenu,
						interactionKind: "click-target",
						position: "bottom"
					}}
					text={connectionData.options.authMechanism}
				/>
			</div>
		</FormGroup>
	</div>;
};
