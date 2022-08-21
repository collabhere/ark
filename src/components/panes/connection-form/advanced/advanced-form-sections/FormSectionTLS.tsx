import { Checkbox, FormGroup } from "@blueprintjs/core";
import React, { FC, useCallback } from "react";
import { Button } from "../../../../../common/components/Button";
import { createDropdownMenu } from "../../../../../common/components/DropdownMenu";
import { FileInput } from "../../../../../common/components/FileInput";
import { AdvancedConnectionFormProps } from "../AdvancedConnectionForm";

export const FormSectionTLS: FC<AdvancedConnectionFormProps> = (props) => {
	const { connectionData, editConnection } = props;

	const tlsAuthMenu = createDropdownMenu([
		{
			onClick: () => {
				editConnection("tlsMethod", "self-signed");
				editConnection("options", {
					...connectionData.options,
					tlsCAFile: undefined,
					tlsCertificateFile: undefined,
					tlsCertificateKeyFile: undefined,
					tlsCertificateKeyFilePassword: undefined,
				});
			},
			key: "self-signed",
			text: "Self-signed certificate",
		},
		{
			onClick: () => editConnection("tlsMethod", "ca-certificate"),
			key: "ca-certificate",
			text: "Provide Root CA",
		},
	]);

	const toggleTLS = useCallback(() => {
		if (connectionData.options.tls) {
			editConnection("options", {
				...connectionData.options,
				tls: false,
				tlsCAFile: undefined,
				tlsCertificateFile: undefined,
				tlsCertificateKeyFile: undefined,
				tlsCertificateKeyFilePassword: undefined,
			});
		} else {
			editConnection("options", {
				...connectionData.options,
				tls: true,
			});
		}
	}, [connectionData.options, editConnection]);

	const setOption = useCallback(
		(key, value) => {
			editConnection("options", {
				...connectionData.options,
				[key]: value,
			});
		},
		[connectionData.options, editConnection],
	);

	return (
		<div className="form">
			<div className="flex-inline">
				<FormGroup>
					<div className="input-field">
						<Checkbox checked={connectionData.options.tls} onChange={() => toggleTLS()} label="Use TLS protocol" />
					</div>
				</FormGroup>
			</div>
			<FormGroup
				helperText={
					connectionData.tlsMethod === "self-signed" ? (
						"Ark will use it's own certificate. Use this if your server does not have custom certificates."
					) : (
						<span>
							{"Reference for all the TLS options below over "}
							<a
								rel="noreferrer"
								target={"_blank"}
								href="https://www.mongodb.com/docs/mongodb-shell/reference/options/#tls-options"
							>
								{"here"}
							</a>
							{"."}
						</span>
					)
				}
				label="Authentication Method"
			>
				<div className="input-field">
					<Button
						size="small"
						disabled={!connectionData.options.tls}
						rightIcon="caret-down"
						dropdownOptions={{
							content: tlsAuthMenu,
							interactionKind: "click-target",
							position: "bottom",
						}}
						text={connectionData.tlsMethod === "self-signed" ? "Self-signed certificate" : "Provide root CA"}
					/>
				</div>
			</FormGroup>
			{connectionData.tlsMethod === "ca-certificate" && (
				<div>
					<FormGroup
						helperText="Use your own root CA certificate (.pem) file. If not provided, we will use a system preferred certificate."
						label="CA Certificate (--tlsCAFile)"
					>
						<FileInput
							fill
							disabled={!connectionData.options.tls}
							text={connectionData.options.tlsCAFile || "Choose an file..."}
							onFileChange={(list) => {
								const file = list.item(0);
								if (file) {
									const { path } = file as any;
									setOption("tlsCAFile", path);
								}
							}}
						/>
					</FormGroup>
					<FormGroup helperText="" label="Certificate (--tlsCertificateFile)">
						<FileInput
							fill
							disabled={!connectionData.options.tls}
							text={connectionData.options.tlsCertificateFile || "Choose an file..."}
							onFileChange={(list) => {
								const file = list.item(0);
								if (file) {
									const { path } = file as any;
									setOption("tlsCertificateFile", path);
								}
							}}
						/>
					</FormGroup>
					<div className="flex-inline">
						<FormGroup helperText="Use a client key (.pem) file." label="Client Key (--tlsCertificateKeyFile)">
							<FileInput
								fill
								disabled={!connectionData.options.tls}
								text={connectionData.options.tlsCertificateKeyFile || "Choose an file..."}
								onFileChange={(list) => {
									const file = list.item(0);
									if (file) {
										const { path } = file as any;
										setOption("tlsCertificateKeyFile", path);
									}
								}}
							/>
						</FormGroup>
						<FormGroup
							helperText="Passphrase for your key file. Leave empty if no passphrase is set."
							label="Client Key Passphrase (--tlsCertificateKeyFilePassword)"
						>
							<FileInput
								fill
								disabled={!connectionData.options.tls}
								text={connectionData.options.tlsCertificateKeyFilePassword || "Choose an file..."}
								onFileChange={(list) => {
									const file = list.item(0);
									if (file) {
										const { path } = file as any;
										setOption("tlsCertificateKeyFilePassword", path);
									}
								}}
							/>
						</FormGroup>
					</div>
				</div>
			)}
		</div>
	);
};
