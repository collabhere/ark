import React, { useCallback, useState } from "react";
import { Input, Button, Checkbox, Menu, Dropdown, Upload } from "antd";
import { dispatch } from "../../../common/utils/events";
import "../styles.less";
import "../../../common/styles/layout.less";
const { TextArea } = Input;
export interface ConnectionFormProps {
	connectionParams?: Ark.StoredConnection;
	mode?: "edit" | "clone";
}

export function ConnectionForm(props: ConnectionFormProps): JSX.Element {
	const [type, setType] = useState<"basic" | "advanced">(
		props.mode === "edit" || props.mode === "clone" ? "advanced" : "basic"
	);

	const [form, setForm] = useState<
		"connection" | "authentication" | "ssh" | "tls" | "misc"
	>("connection");

	const [sshAuthMethod, toggleAuthMethod] = useState<"password" | "privateKey">(
		"password"
	);

	const [host, setHost] = useState<string>(
		props.connectionParams?.hosts
			? props.connectionParams?.hosts[0].split(":")[0]
			: ""
	);

	const [port, setPort] = useState<string>(
		props.connectionParams?.hosts
			? props.connectionParams?.hosts[0].split(":")[1]
			: ""
	);

	// const [useSSH, toggleSSH] = useState<boolean>(false);
	const connectionDetails = props.connectionParams
		? {
				...props.connectionParams,
				id:
					props.connectionParams && props.mode === "clone"
						? ""
						: props.connectionParams.id,
		  }
		: {
				id: "",
				name: "",
				protocol: "mongodb",
				hosts: [],
				database: "",
				type: "directConnection" as const,
				username: "",
				password: "",
				options: {
					tls: false,
				},
				ssh: {
					useSSH: false,
				},
		  };

	const [mongoURI, setMongoURI] = useState("");
	const [connectionData, setConnectionData] =
		useState<Ark.StoredConnection>(connectionDetails);

	const saveMongoURI = useCallback(() => {
		window.ark.driver
			.run("connection", "save", {
				type: "uri",
				config: {
					uri: mongoURI,
					name: "Test Connection " + new Date().valueOf(),
				},
			})
			.then((connectionId) => {
				dispatch("connection_manager:add_connection", { connectionId });
			});
	}, [mongoURI]);

	const saveAdvancedConnection = useCallback(() => {
		window.ark.driver
			.run("connection", "save", {
				type: "config",
				config: {
					...connectionData,
					hosts:
						connectionData.type === "directConnection"
							? [`${host}:${port}`]
							: connectionData.hosts,
					name:
						connectionData.name || "Test Connection " + new Date().valueOf(),
				},
			})
			.then((connectionId) => {
				dispatch("connection_manager:add_connection", { connectionId });
			});
	}, [connectionData, host, port]);

	const editConnection = useCallback(function <T extends Ark.StoredConnection>(
		key: keyof T,
		value: T[keyof T]
	) {
		if (key && value) {
			setConnectionData((conn) => ({ ...conn, [key]: value }));
		}
	},
	[]);

	const editSSHDetails = useCallback(
		function <T extends Ark.StoredConnection["ssh"]>(
			key: keyof T,
			value: T[keyof T]
		) {
			if (key && value) {
				editConnection("ssh", {
					...connectionData.ssh,
					[key]: value,
				});
			}
		},
		[connectionData.ssh, editConnection]
	);

	const sshMenu = (
		<Menu onClick={(e) => toggleAuthMethod(e.key as typeof sshAuthMethod)}>
			<Menu.Item key="password">Password</Menu.Item>
			<Menu.Item key="privateKey">Private key</Menu.Item>
		</Menu>
	);

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
									<div className="flex-inline">
										<div style={{ flexGrow: 1 }}>
											<div className="Label">
												<span style={{ margin: "auto" }}>Host</span>
											</div>
											<div className="InputField">
												<Input
													className="Input"
													value={host}
													onChange={(e) => setHost(e.target.value)}
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
													value={port}
													onChange={(e) => setPort(e.target.value)}
												/>
											</div>
										</div>
									</div>
								)}

								{connectionData.type === "replicaSet" && (
									<div>
										<div className="Label">
											<span style={{ margin: "auto" }}>Hosts</span>
										</div>
										<div className="InputField">
											<TextArea
												className="Input"
												value={connectionData?.hosts}
												onChange={(e) =>
													editConnection("hosts", e.target.value.split(","))
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
										<Input
											className="Input"
											value={connectionData?.database}
											onChange={(e) =>
												editConnection("database", e.target.value)
											}
										/>
									</div>
								</div>
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>Username</span>
									</div>
									<div className="InputField">
										<Input
											className="Input"
											value={connectionData?.username}
											onChange={(e) =>
												editConnection("username", e.target.value)
											}
										/>
									</div>
								</div>

								<div className="flex-inline">
									<div style={{ flexGrow: 1 }}>
										<div className="Label">
											<span style={{ margin: "auto" }}>Password</span>
										</div>
										<div className="InputField">
											<Input
												className="Input"
												type="password"
												value={connectionData?.password}
												onChange={(e) =>
													editConnection("password", e.target.value)
												}
											/>
										</div>
									</div>
								</div>
							</div>
						)}
						{form === "ssh" && (
							<div className="Form">
								<div className="flex-inline">
									<div className="Label">
										<span style={{ margin: "auto" }}>Use SSH Tunnel</span>
									</div>
									<Checkbox
										value={connectionDetails.ssh.useSSH}
										onChange={() =>
											editSSHDetails("useSSH", !connectionDetails.ssh.useSSH)
										}
									/>
								</div>
								<div className="flex-inline">
									<div style={{ flexGrow: 1 }}>
										<div className="Label">
											<span style={{ margin: "auto" }}>Host</span>
										</div>
										<div className="InputField">
											<Input
												className="Input"
												value={connectionData?.ssh?.host}
												disabled={!connectionData.ssh.useSSH}
												onChange={(e) => editSSHDetails("host", e.target.value)}
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
												disabled={!connectionData.ssh.useSSH}
												onChange={(e) => editSSHDetails("port", e.target.value)}
											/>
										</div>
									</div>
								</div>
								<div className="flex-inline">
									<div style={{ flexGrow: 1 }}>
										<div className="Label">
											<span style={{ margin: "auto" }}>Mongod host</span>
										</div>
										<div className="InputField">
											<Input
												className="Input"
												value={connectionData?.ssh?.mongodHost}
												disabled={!connectionData.ssh.useSSH}
												onChange={(e) =>
													editSSHDetails("mongodHost", e.target.value)
												}
											/>
										</div>
									</div>
									<div>
										<div className="Label">
											<span style={{ margin: "auto" }}>Mongod port</span>
										</div>
										<div className="InputField">
											<Input
												className="Input"
												value={connectionData?.ssh?.mongodPort}
												disabled={!connectionData.ssh.useSSH}
												onChange={(e) =>
													editSSHDetails("mongodPort", e.target.value)
												}
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
											disabled={!connectionData.ssh.useSSH}
											onChange={(e) =>
												editSSHDetails("username", e.target.value)
											}
										/>
									</div>
								</div>
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>Auth Method</span>
									</div>
									<div className="InputField">
										<Dropdown.Button
											disabled={!connectionData.ssh.useSSH}
											overlay={sshMenu}
										>
											{sshAuthMethod === "password"
												? "Password"
												: "Private key"}
										</Dropdown.Button>
									</div>
								</div>
								{sshAuthMethod === "password" && (
									<div>
										<div className="Label">
											<span style={{ margin: "auto" }}>Password</span>
										</div>
										<div className="InputField">
											<Input
												className="Input"
												value={connectionData.ssh?.password}
												disabled={!connectionData.ssh.useSSH}
												onChange={(e) =>
													editSSHDetails("password", e.target.value)
												}
											/>
										</div>
									</div>
								)}
								{sshAuthMethod === "privateKey" && (
									<div>
										<div className="Label">
											<span style={{ margin: "auto" }}>Private Key</span>
										</div>
										<div className="InputField">
											<Input
												className="Input"
												value={connectionData?.ssh?.privateKey}
												disabled={!connectionData.ssh.useSSH}
												onChange={(e) =>
													editSSHDetails("privateKey", e.target.value)
												}
											/>
										</div>
									</div>
								)}
								{sshAuthMethod === "privateKey" && (
									<div>
										<div className="Label">
											<span style={{ margin: "auto" }}>Passphrase</span>
										</div>
										<div className="InputField">
											<Input
												className="Input"
												value={connectionData?.ssh?.method}
												disabled={!connectionData.ssh.useSSH}
												onChange={(e) =>
													editSSHDetails("passphrase", e.target.value)
												}
											/>
										</div>
									</div>
								)}
							</div>
						)}
						{form === "tls" && (
							<div className="Form Gap">
								<div className="flex-inline">
									<div className="Label">
										<span style={{ margin: "auto" }}>Use TLS protocol</span>
									</div>
									<Checkbox
										checked={connectionData.options.tls}
										onChange={(e) =>
											editConnection("options", {
												...connectionData.options,
												tls: e.target.checked,
											})
										}
									/>
								</div>
								<div className="flex-inline">
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
										<Input className="Input" value={connectionData?.username} />
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
