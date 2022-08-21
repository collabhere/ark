import { FormGroup, InputGroup, TextArea } from "@blueprintjs/core";
import React, { FC } from "react";
import { AdvancedConnectionFormProps } from "../AdvancedConnectionForm";
import { Button } from "../../../../../common/components/Button";
import { createDropdownMenu } from "../../../../../common/components/DropdownMenu";
import { hostStringToHost, hostToString } from "../../../../../common/utils/misc";

export const FormSectionConnection: FC<AdvancedConnectionFormProps> = (props) => {

	const {
		connectionData,
		editConnection
	} = props;

	const connectionTypeMenu = createDropdownMenu([
		{
			onClick: () => editConnection("type", "directConnection"),
			key: "directConnection",
			text: "Direct Connection",
		},
		{
			onClick: () => editConnection("type", "replicaSet"),
			key: "replicaSet",
			text: "Replica Set",
		},
	]);

	return <div className="form">
		<FormGroup
			helperText={<span>{"Select the type of connection."}</span>}
			label="Type"
			labelFor="connection-type"
		>
			<div className="input-field">
				<Button
					size="small"
					rightIcon="caret-down"
					dropdownOptions={{
						content: connectionTypeMenu,
						interactionKind: "click-target",
						position: "bottom"
					}}
					text={connectionData?.type === "replicaSet"
						? "Replica Set"
						: "Direct connection"}
				/>
			</div>
		</FormGroup>
		<div>
			<FormGroup label="Name">
				<div className="input-field">
					<InputGroup
						value={connectionData?.name}
						onChange={(e) => editConnection("name", e.target.value)}
					/>
				</div>
			</FormGroup>
		</div>

		{connectionData.type === "directConnection" && (
			<div className="flex-inline">
				<div style={{ flexGrow: 1 }}>
					<FormGroup label="Host">
						<div className="input-field">
							<InputGroup
								value={connectionData.hosts[0]?.host || "localhost"}
								onChange={(e) => editConnection("host.0", { host: e.target.value })}
							/>
						</div>
					</FormGroup>
				</div>
				<div>
					<FormGroup label="Port">
						<div className="input-field">
							<InputGroup
								value={typeof connectionData.hosts[0]?.port == "number" ? (connectionData.hosts[0].port + "") : "27017"}
								onChange={(e) => editConnection("host.0", { port: e.target.value ? parseInt(e.target.value) : 27017 })}
							/>
						</div>
					</FormGroup>
				</div>
			</div>
		)}

		{connectionData.type === "replicaSet" && (
			<FormGroup
				label="Hosts"
				helperText="Use a new line to separate hosts."
			>
				<div className="input-field">
					<TextArea
						value={connectionData?.hosts.map(h => hostToString(h)).join("\n")}
						onChange={(e) => {
							const hostStrings = e.target.value.split("\n");
							const hosts = hostStrings.map(str => hostStringToHost(str));
							editConnection("hosts", hosts);
						}}
					/>
				</div>
			</FormGroup>

		)}
	</div>;
}