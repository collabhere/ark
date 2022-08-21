import { FormGroup, InputGroup } from "@blueprintjs/core";
import { AuthMechanism } from "mongodb";
import React, { FC, useMemo } from "react";
import { Button } from "../../../../../common/components/Button";
import { createDropdownMenu } from "../../../../../common/components/DropdownMenu";
import { AdvancedConnectionFormProps } from "../AdvancedConnectionForm";

const AUTH_MECHANISMS: AuthMechanism[] = [
	"DEFAULT",
	"MONGODB-X509",
	"PLAIN",
	"SCRAM-SHA-1",
	"SCRAM-SHA-256",
	// "GSSAPI", // @todo: support for this
	// "MONGODB-AWS", // @todo: support for this
];

export const FormSectionAuthentication: FC<AdvancedConnectionFormProps> = (props) => {
	const { connectionData, editConnection } = props;

	const menuList = useMemo(() => {
		return AUTH_MECHANISMS.map((mech) => ({
			onClick: () =>
				editConnection("options", {
					...connectionData.options,
					authMechanism: mech,
				}),
			key: mech,
			text: mech,
		}));
	}, [connectionData.options, editConnection]);

	const authMechanismMenu = useMemo(() => createDropdownMenu(menuList), [menuList]);

	return (
		<div className="form">
			<FormGroup label="Database" helperText="Authentication database name">
				<div className="input-field">
					<InputGroup value={connectionData?.database} onChange={(e) => editConnection("database", e.target.value)} />
				</div>
			</FormGroup>
			<FormGroup label="Username">
				<div className="input-field">
					<InputGroup value={connectionData?.username} onChange={(e) => editConnection("username", e.target.value)} />
				</div>
			</FormGroup>
			<FormGroup label="Password">
				<div className="input-field">
					<InputGroup
						type="password"
						value={connectionData?.password}
						onChange={(e) => editConnection("password", e.target.value)}
					/>
				</div>
			</FormGroup>
			<FormGroup
				helperText={
					<div>
						<span>
							{"Note that Ark does not configure other requirements for the chosen mechanism. More on auth mechanisms "}
						</span>
						<a
							rel="noreferrer"
							href="https://www.mongodb.com/docs/drivers/node/current/fundamentals/authentication/mechanisms/"
							target={"_blank"}
						>
							{"here"}
						</a>
						<span>.</span>
					</div>
				}
				label="Authentication Mechanism"
			>
				<div className="input-field">
					<Button
						size="small"
						rightIcon="caret-down"
						dropdownOptions={{
							content: authMechanismMenu,
							interactionKind: "click-target",
							position: "bottom",
						}}
						text={connectionData.options.authMechanism || "DEFAULT"}
					/>
				</div>
			</FormGroup>
		</div>
	);
};
