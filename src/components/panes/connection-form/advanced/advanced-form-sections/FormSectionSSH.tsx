import { Checkbox, FormGroup, InputGroup, TextArea } from "@blueprintjs/core";
import React, { FC, useCallback } from "react";
import { Button } from "../../../../../common/components/Button";
import { createDropdownMenu } from "../../../../../common/components/DropdownMenu";
import { AdvancedConnectionFormProps } from "../AdvancedConnectionForm";

export const FormSectionSSH: FC<AdvancedConnectionFormProps> = (props) => {

	const {
		connectionData,
		editConnection
	} = props;

	const editSSHDetails = useCallback(
		function <T extends Ark.StoredConnection["ssh"]>(
			key: keyof T,
			value: T[keyof T]
		) {
			if (key && value !== undefined) {
				editConnection("ssh", {
					...connectionData.ssh,
					[key]: value,
				});
			}
		},
		[connectionData.ssh, editConnection]
	);

	const sshAuthMenu = createDropdownMenu([
		{
			onClick: () => editSSHDetails("method", "password"),
			key: "password",
			text: "Password",
		},
		{
			onClick: () => editSSHDetails("method", "privateKey"),
			key: "privateKey",
			text: "Private Key",
		},
	]);

	return <div className="form">
		<div className="flex-inline">
			<FormGroup helperText="When enabled, any configurations made in the 'Connection' section will be ignored.">
				<div className="input-field">
					<Checkbox
						checked={connectionData.ssh.useSSH}
						onChange={() =>
							editSSHDetails("useSSH", !connectionData.ssh.useSSH)
						}
						label="Use SSH Tunnel"
					/>
				</div>
			</FormGroup>
		</div>
		<div className="flex-inline">
			<FormGroup label="Tunnel Host">
				<div className="input-field">
					<InputGroup
						value={connectionData?.ssh?.host}
						disabled={!connectionData.ssh.useSSH}
						onChange={(e) => editSSHDetails("host", e.target.value)}
					/>
				</div>
			</FormGroup>
			<FormGroup label="Tunnel Port">
				<div className="input-field">
					<InputGroup
						value={connectionData?.ssh?.port}
						disabled={!connectionData.ssh.useSSH}
						onChange={(e) => editSSHDetails("port", e.target.value)}
					/>
				</div>
			</FormGroup>
		</div>
		<div className="flex-inline">
			<FormGroup label="MongoDB Host">
				<div className="input-field">
					<InputGroup
						value={connectionData?.ssh?.mongodHost}
						disabled={!connectionData.ssh.useSSH}
						onChange={(e) =>
							editSSHDetails("mongodHost", e.target.value)
						}
					/>
				</div>
			</FormGroup>
			<FormGroup label="MongoDB Port">
				<div className="input-field">
					<InputGroup
						value={connectionData?.ssh?.mongodPort}
						disabled={!connectionData.ssh.useSSH}
						onChange={(e) =>
							editSSHDetails("mongodPort", e.target.value)
						}
					/>
				</div>
			</FormGroup>
		</div>
		<FormGroup label="Username">
			<div className="input-field">
				<InputGroup
					value={connectionData?.ssh?.username}
					disabled={!connectionData.ssh.useSSH}
					onChange={(e) =>
						editSSHDetails("username", e.target.value)
					}
				/>
			</div>
		</FormGroup>
		<FormGroup label="Authentication Method">
			<div className="input-field">
				<Button
					size="small"
					rightIcon="caret-down"
					disabled={!connectionData.ssh.useSSH}
					dropdownOptions={{
						content: sshAuthMenu,
						interactionKind: "click-target",
						position: "bottom"
					}}
					text={connectionData.ssh.method === "password" ? "Password" : "Private key"}
				/>
			</div>
		</FormGroup>
		{connectionData.ssh.method === "password" && (
			<FormGroup label="Password">
				<div className="input-field">
					<InputGroup
						value={connectionData.ssh?.password}
						disabled={!connectionData.ssh.useSSH}
						onChange={(e) =>
							editSSHDetails("password", e.target.value)
						}
					/>
				</div>
			</FormGroup>
		)}
		{connectionData.ssh.method === "privateKey" && (
			<FormGroup
				label="Private Key"
				helperText="Enter your private key here"
			>
				<div className="input-field">
					<TextArea
						value={connectionData?.ssh?.privateKey}
						disabled={!connectionData.ssh.useSSH}
						onChange={(e) =>
							editSSHDetails("privateKey", e.target.value)
						}
					/>
				</div>
			</FormGroup>
		)}
		{connectionData.ssh.method === "privateKey" && (
			<FormGroup
				label="Passphrase"
				helperText="Optional key passphrase"
			>
				<div className="input-field">
					<InputGroup
						value={connectionData?.ssh?.method}
						disabled={!connectionData.ssh.useSSH}
						onChange={(e) =>
							editSSHDetails("passphrase", e.target.value)
						}
					/>
				</div>
			</FormGroup>
		)}
	</div>;
};