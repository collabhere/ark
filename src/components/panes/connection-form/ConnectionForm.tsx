import React, { useCallback, useEffect, useState } from "react";
import { Input, Button, Checkbox, Menu, Dropdown, Upload } from "antd";
import { dispatch } from "../../../common/utils/events";
import "../styles.less";
import "../../../common/styles/layout.less";
import { notify } from "../../../common/utils/misc";
import { parse } from "mongodb-uri";
import { RcFile } from "antd/lib/upload";
import { UploadFile } from "antd/lib/upload/interface";
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

	const [tlsAuthMethod, toggleTlsAuthMethod] = useState<
		"CACertificate" | "self-signed"
	>("self-signed");

	const [host, setHost] = useState<string>(
		props.connectionParams?.hosts
			? props.connectionParams?.hosts[0].split(":")[0]
			: ""
	);

	const [icon, setIcon] = useState<UploadFile<Blob>>();

	const [port, setPort] = useState<string>(
		props.connectionParams?.hosts
			? props.connectionParams?.hosts[0].split(":")[1]
			: ""
	);

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
					authMechanism:
						"SCRAM-SHA-1" as Ark.StoredConnection["options"]["authMechanism"],
				},
				ssh: {
					useSSH: false,
					mongodHost: "127.0.0.1",
					port: "22",
					mongodPort: "27017",
				},
		  };

	const [mongoURI, setMongoURI] = useState("");
	const [connectionData, setConnectionData] =
		useState<Ark.StoredConnection>(connectionDetails);

	useEffect(() => {
		if (connectionData.id && connectionData.icon) {
			window.ark.driver
				.run("connection", "fetchIcon", { id: connectionData.id })
				.then((icon) => {
					if (icon && icon.name) {
						setIcon(icon);
					}
				});
		}
	}, [connectionData.icon, connectionData.id]);

	const validateUri = useCallback((uri: string) => {
		try {
			const parsedUri = parse(uri);
			if (
				parsedUri &&
				parsedUri.scheme.includes("mongodb") &&
				parsedUri.hosts.every((elem) => !!elem.host && !!elem.port)
			) {
				return true;
			}

			notify({
				type: "error",
				description: "Invalid URI format",
			});

			return false;
		} catch (err) {
			console.log(err);
			notify({
				type: "error",
				description:
					err && (err as Error).message ? (err as Error).message : "Ivalid URI",
			});

			return false;
		}
	}, []);

	const saveMongoURI = useCallback(() => {
		if (validateUri(mongoURI)) {
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
		}
	}, [mongoURI, validateUri]);

	const testURIConnection = useCallback(() => {
		if (validateUri(mongoURI)) {
			window.ark.driver
				.run("connection", "test", {
					type: "uri",
					config: {
						uri: mongoURI,
						name: "",
					},
				})
				.then((res) => {
					const notification: Parameters<typeof notify>[0] = {
						title: "Test connection",
						description: res.message,
						type: res.status ? "success" : "error",
					};

					notify(notification);
				});
		}
	}, [mongoURI, validateUri]);

	const validateAdvancedConfig = useCallback(() => {
		const error: Partial<Parameters<typeof notify>[0]> = {};
		if (!connectionData.type) {
			error.description = "Invalid connection type.";
		} else if (!connectionData.hosts || !(!!host && !isNaN(Number(port)))) {
			error.description = "Invalid hosts config.";
		} else if (
			connectionData.options.tls &&
			tlsAuthMethod === "CACertificate" &&
			!connectionData.options.tlsCertificateFile
		) {
			error.description = "Specify the TLS certificate file to be used";
		} else if (connectionData.ssh.useSSH) {
			if (
				!connectionData.ssh.host ||
				!connectionData.ssh.port ||
				isNaN(Number(connectionData.ssh.port))
			) {
				error.description = "Incorrect host or port format.";
			} else if (
				!connectionData.ssh.mongodHost ||
				!connectionData.ssh.mongodPort ||
				isNaN(Number(connectionData.ssh.mongodPort))
			) {
				error.description = "Incorrect mongod host or port.";
			} else if (!connectionData.ssh.username) {
				error.description = "Invalid username.";
			} else if (
				(sshAuthMethod === "password" && !connectionData.ssh.password) ||
				(sshAuthMethod === "privateKey" && !connectionData.ssh.privateKey)
			) {
				error.description =
					"Either the password or the private key must be specified.";
			}

			if (error.description) {
				error.title = "Invalid SSH config";
			}
		}

		if (error.description) {
			notify({
				title: error.title || "Configuration error.",
				description: error.description || "",
				type: "error",
			});

			return false;
		}

		return true;
	}, [connectionData, host, port, sshAuthMethod, tlsAuthMethod]);

	const saveAdvancedConnection = useCallback(() => {
		if (validateAdvancedConfig()) {
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
					icon: icon,
				})
				.then((connectionId) => {
					dispatch("connection_manager:add_connection", { connectionId });
				});
		}
	}, [connectionData, host, icon, port, validateAdvancedConfig]);

	const testAdvancedConnection = useCallback(() => {
		if (validateAdvancedConfig()) {
			window.ark.driver
				.run("connection", "test", {
					type: "config",
					config: {
						...connectionData,
						hosts:
							connectionData.type === "directConnection"
								? [`${host}:${port}`]
								: connectionData.hosts,
						name: "",
					},
				})
				.then((res) => {
					const notification: Parameters<typeof notify>[0] = {
						title: "Test connection",
						description: res.message,
						type: res.status ? "success" : "error",
					};

					notify(notification);
				});
		}
	}, [connectionData, host, port, validateAdvancedConfig]);

	const editConnection = useCallback(function <T extends Ark.StoredConnection>(
		key: keyof T,
		value: T[keyof T]
	) {
		if (key && value !== undefined) {
			setConnectionData((conn) => ({ ...conn, [key]: value }));
		}
	},
	[]);

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

	const sshAuthMenu = (
		<Menu onClick={(e) => toggleAuthMethod(e.key as typeof sshAuthMethod)}>
			<Menu.Item key="password">Password</Menu.Item>
			<Menu.Item key="privateKey">Private key</Menu.Item>
		</Menu>
	);

	const tlsAuthMenu = (
		<Menu onClick={(e) => toggleTlsAuthMethod(e.key as typeof tlsAuthMethod)}>
			<Menu.Item key="self-signed">Self-signed certificate</Menu.Item>
			<Menu.Item key="CACertificate">CA Certificate</Menu.Item>
		</Menu>
	);

	const authMechanismMenu = (
		<Menu
			onClick={(e) =>
				editConnection("options", {
					...connectionData.options,
					authMechanism:
						e.key as Ark.StoredConnection["options"]["authMechanism"],
				})
			}
		>
			<Menu.Item key={"SCRAM-SHA-1"}>SCRAM-SHA-1</Menu.Item>
			<Menu.Item key={"SCRAM-SHA-256"}>SCRAM-SHA-256</Menu.Item>
		</Menu>
	);

	const menu = (
		<Menu onClick={(e) => editConnection("type", e.key)}>
			<Menu.Item key="directConnection">Direct Connection</Menu.Item>
			<Menu.Item key="replicaSet">Replica Set</Menu.Item>
		</Menu>
	);

	const beforeIconUpload = (file: RcFile): Promise<RcFile> => {
		return new Promise((resolve, reject) => {
			if (
				(file.type === "image/png" || file.type === "image/svg") &&
				file.size <= 1500
			) {
				dispatch("connection_manager:copy_icon", {
					name: file.name,
					path: file.path,
				});
				resolve(file);
			} else {
				reject("Invalid file type or size.");
			}
		});
	};

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
									<Button type="text" onClick={() => testURIConnection()}>
										Test
									</Button>
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

								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>
											Authentication Mechanism
										</span>
									</div>
									<div className="InputField">
										<Dropdown.Button overlay={authMechanismMenu}>
											{connectionData.options.authMechanism}
										</Dropdown.Button>
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
											editSSHDetails("useSSH", !connectionData.ssh.useSSH)
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
										<span style={{ margin: "auto" }}>
											Authentication Method
										</span>
									</div>
									<div className="InputField">
										<Dropdown.Button
											disabled={!connectionData.ssh.useSSH}
											overlay={sshAuthMenu}
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
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>
											Authentication Method
										</span>
									</div>
									<div className="InputField">
										<Dropdown.Button
											disabled={!connectionData.options.tls}
											overlay={tlsAuthMenu}
										>
											{tlsAuthMethod === "self-signed"
												? "Self-signed certificate"
												: "CA certificate"}
										</Dropdown.Button>
									</div>
								</div>
								{tlsAuthMethod === "CACertificate" && (
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
								)}
							</div>
						)}
						{form === "misc" && (
							<div className="Form Gap">
								<div className="flex-inline">
									<div className="Label">
										<span style={{ margin: "auto" }}>Icon</span>
									</div>
									<div className="InputField">
										<Upload
											customRequest={(options) =>
												options.onSuccess && options.onSuccess("ok")
											}
											beforeUpload={beforeIconUpload}
											maxCount={1}
											listType="picture"
											onChange={(e) => {
												if (e.file.status === "removed") {
													editConnection("icon", false);
													setIcon(undefined);
												} else {
													editConnection("icon", true);
													setIcon(e.file);
												}
											}}
											fileList={icon && connectionData.icon ? [icon] : []}
										>
											<Button>Upload Icon</Button>
										</Upload>
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
									<Button type="text" onClick={() => testAdvancedConnection()}>
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
