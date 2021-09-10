import React, { useCallback, useState } from "react";
import { Input, Button, Checkbox, Menu, Dropdown, Upload } from "antd";
import "./panes.less";
import { nanoid } from "nanoid";
const { TextArea } = Input;
export interface ConnectionFormProps {
	connectionParams?: Ark.StoredConnection & { mode?: "edit" | "clone" };
}

export function ConnectionForm(props: ConnectionFormProps): JSX.Element {
	const [type, setType] = useState<"basic" | "advanced">(
		props.connectionParams &&
			(props.connectionParams.mode === "edit" ||
				props.connectionParams.mode === "clone")
			? "advanced"
			: "basic"
	);

	const [form, setForm] = useState<
		"connection" | "authentication" | "ssh" | "tls" | "misc"
	>("connection");

	const [useSSH, toggleSSH] = useState<boolean>(false);
	const [useTLS, toggleTLS] = useState<boolean>(
		props.connectionParams?.options.tls || true
	);
	// const [useSSH, toggleSSH] = useState<boolean>(false);

	const [mongoURI, setMongoURI] = useState("");
	const [connectionData, setConnectionData] = useState<Ark.StoredConnection>(
		props.connectionParams || {
			id: "",
			name: "",
			members: [],
			database: "",
			type: "directConnection",
			username: "",
			password: "",
			options: {
				tls: true,
			},
		}
	);

	const saveMongoURI = useCallback(() => {
		window.ark.driver
			.run("connection", "saveConnectionFromUri", {
				type: "uri",
				uri: mongoURI,
				name: "Test Connection " + new Date().valueOf(),
			})
			.then((connectionId) => {
				console.log("Saved connection id: ", connectionId);
			});
	}, [mongoURI]);

	const saveAdvancedConnection = useCallback(() => {
		window.ark.driver
			.run("connection", "saveConnectionFromConfig", {
				type: "config",
				config: {
					...connectionData,
					name:
						connectionData.name || "Test Connection " + new Date().valueOf(),
				},
			})
			.then((connectionId) => {
				console.log("Saved connection id: ", connectionId);
			});
	}, [connectionData]);

	const editConnection = useCallback(function <T extends Ark.StoredConnection>(
		key: keyof T,
		value: T[keyof T]
	) {
		if (key && value) {
			setConnectionData((conn) => ({ ...conn, [key]: value }));
		}
	},
	[]);

	const uploadProps = {
		onChange(info) {
			console.log(info);
			if (info.file.status !== "uploading") {
				console.log(info.file, info.fileList);
			}
		},
	};

	const menu = (
		<Menu onClick={(e) => editConnection("type", e.key)}>
			<Menu.Item key="directConnection">Direct Connection</Menu.Item>
			<Menu.Item key="replicaSet">Replica Set</Menu.Item>
		</Menu>
	);

	return (
		<div className="UriContainer">
			<div className="FieldContainer">
				{type === "basic" && (
					<div className="FormWrapper">
						<div className="HeaderWrapper">
							<span>New DB Connection</span>
						</div>
						<div className="Form">
							<div className="Label">
								<span style={{ margin: "auto" }}>DB URI</span>
							</div>
							<div className="InputField">
								<Input
									className="Input"
									onChange={(e) => setMongoURI(e.target.value)}
									value={mongoURI}
								/>
							</div>
							<div className="ButtonGroup">
								<div>
									<Button type="text">Test</Button>
								</div>
								<div>
									<Button onClick={() => saveMongoURI()}>Save</Button>
								</div>
							</div>
						</div>
						<div className="Separator">
							<div className="HorizontalLine"></div>
							<div>
								<span>OR</span>
							</div>
							<div className="HorizontalLine"></div>
						</div>
						<div className="AdvancedButton" onClick={() => setType("advanced")}>
							<span>Advanced Settings</span>
						</div>
					</div>
				)}
				{type === "advanced" && (
					<div className="ConnectionFormWrapper">
						<div className="HeaderWrapper">
							<div
								className="AdvancedFormHeader"
								onClick={() => setForm("connection")}
							>
								<span>Connection</span>
							</div>
							<div
								className="AdvancedFormHeader"
								onClick={() => setForm("authentication")}
							>
								<span>Authentication</span>
							</div>
							<div
								className="AdvancedFormHeader"
								onClick={() => setForm("ssh")}
							>
								<span>SSH</span>
							</div>
							<div
								className="AdvancedFormHeader"
								onClick={() => setForm("tls")}
							>
								<span>TLS</span>
							</div>
							<div
								className="AdvancedFormHeader"
								onClick={() => setForm("misc")}
							>
								<span>Misc</span>
							</div>
						</div>
						{form === "connection" && (
							<div className="Form">
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>Type</span>
									</div>
									<div className="InputField">
										<Dropdown.Button overlay={menu}>
											{connectionData?.type === "replicaSet"
												? "Replica Set"
												: "Direct connection"}
										</Dropdown.Button>
									</div>
								</div>
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>Name</span>
									</div>
									<div className="InputField">
										<Input
											className="Input"
											value={connectionData?.name}
											onChange={(e) => editConnection("name", e.target.value)}
										/>
									</div>
								</div>

								{connectionData.type === "directConnection" && (
									<div className="InlineInput">
										<div style={{ flexGrow: 1 }}>
											<div className="Label">
												<span style={{ margin: "auto" }}>Host</span>
											</div>
											<div className="InputField">
												<Input
													className="Input"
													value={
														connectionData?.members[0] &&
														connectionData?.members[0].split(":")[0]
													}
												/>
											</div>
										</div>
										<div>
											<div className="Label">
												<span style={{ margin: "auto" }}>Port</span>
											</div>
											<div className="InputField">
												<Input
													className="Input"
													value={
														connectionData?.members[0] &&
														connectionData?.members[0].split(":")[1]
													}
												/>
											</div>
										</div>
									</div>
								)}

								{connectionData.type === "replicaSet" && (
									<div>
										<div className="Label">
											<span style={{ margin: "auto" }}>Members</span>
										</div>
										<div className="InputField">
											<TextArea
												className="Input"
												value={connectionData?.members}
												onChange={(e) =>
													editConnection("members", e.target.value.split(","))
												}
											/>
										</div>
									</div>
								)}
							</div>
						)}
						{form === "authentication" && (
							<div className="Form">
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>Database</span>
									</div>
									<div className="InputField">
										<Input className="Input" value={connectionData?.database} />
									</div>
								</div>
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>Username</span>
									</div>
									<div className="InputField">
										<Input className="Input" value={connectionData?.username} />
									</div>
								</div>

								<div className="InlineInput">
									<div style={{ flexGrow: 1 }}>
										<div className="Label">
											<span style={{ margin: "auto" }}>Password</span>
										</div>
										<div className="InputField">
											<Input
												className="Input"
												type="password"
												value={connectionData?.password}
											/>
										</div>
									</div>
								</div>
							</div>
						)}
						{form === "ssh" && (
							<div className="Form">
								<div className="InlineInput">
									<div className="Label">
										<span style={{ margin: "auto" }}>Use SSH Tunnel</span>
									</div>
									<Checkbox
										value={useSSH}
										onChange={() => toggleSSH((useSSH) => !useSSH)}
									/>
								</div>
								<div className="InlineInput">
									<div style={{ flexGrow: 1 }}>
										<div className="Label">
											<span style={{ margin: "auto" }}>Host</span>
										</div>
										<div className="InputField">
											<Input
												className="Input"
												value={connectionData?.ssh?.host}
												disabled={!useSSH}
											/>
										</div>
									</div>
									<div>
										<div className="Label">
											<span style={{ margin: "auto" }}>Port</span>
										</div>
										<div className="InputField">
											<Input
												className="Input"
												value={connectionData?.ssh?.port}
												disabled={!useSSH}
											/>
										</div>
									</div>
								</div>
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>Username</span>
									</div>
									<div className="InputField">
										<Input
											className="Input"
											value={connectionData?.ssh?.username}
											disabled={!useSSH}
										/>
									</div>
								</div>
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>Auth Method</span>
									</div>
									<div className="InputField">
										<Input
											className="Input"
											value={connectionData?.ssh?.method}
											disabled={!useSSH}
										/>
									</div>
								</div>
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>Private Key</span>
									</div>
									<div className="InputField">
										<Input
											className="Input"
											value={connectionData?.ssh?.privateKey}
											disabled={!useSSH}
										/>
									</div>
								</div>
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>Passphrase</span>
									</div>
									<div className="InputField">
										<Input
											className="Input"
											value={connectionData?.ssh?.method}
											disabled={!useSSH}
										/>
									</div>
								</div>
							</div>
						)}
						{form === "tls" && (
							<div className="Form Gap">
								<div className="InlineInput">
									<div className="Label">
										<span style={{ margin: "auto" }}>Use TLS protocol</span>
									</div>
									<Checkbox
										value={useTLS}
										onChange={() => toggleTLS((useTLS) => !useTLS)}
									/>
								</div>
								<div className="InlineInput">
									<div className="Label">
										<span style={{ margin: "auto" }}>CA Certificate</span>
									</div>
									<div className="InputField">
										<Upload {...props}>
											<Button>Upload File</Button>
										</Upload>
									</div>
								</div>
							</div>
						)}
						{form === "misc" && (
							<div className="Form">
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>Default Database</span>
									</div>
									<div className="InputField">
										<Input
											className="Input"
											value={connectionData?.username}
											disabled={!useTLS}
										/>
									</div>
								</div>
							</div>
						)}
						<div className="ButtonGroupAdvanced">
							<div className="BackContainer" onClick={() => setType("basic")}>
								<span>Back</span>
							</div>
							<div className="ButtonGroup">
								<div>
									<Button type="text" onClick={() => saveMongoURI()}>
										Test
									</Button>
								</div>
								<div>
									<Button onClick={() => saveAdvancedConnection()}>Save</Button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
