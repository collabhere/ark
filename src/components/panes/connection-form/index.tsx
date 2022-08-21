import { parse } from "mongodb-uri";
import React, { useCallback, useEffect, useState } from "react";
import "../../../common/styles/layout.less";
import { dispatch } from "../../../common/utils/events";
import { notify } from "../../../common/utils/misc";
import { ConnectionFormTab } from "../../browser/Tabs";
import "../styles.less";
import { AdvancedConnectionForm } from "./advanced/AdvancedConnectionForm";
import { BasicConnectionForm } from "./basic/BasicConnectionForm";

type FormType = "basic" | "advanced";

const defaultConnectionSettings = (): Ark.StoredConnection => ({
	id: "",
	name: "",
	protocol: "mongodb",
	hosts: [{ host: "localhost", port: 27017 }],
	database: "",
	type: "directConnection",
	username: "",
	password: "",
	tlsMethod: "self-signed",
	options: {
		tls: false,
	},
	ssh: {
		useSSH: false,
		mongodHost: "127.0.0.1",
		port: "22",
		mongodPort: "27017",
	},
});

export interface EditConnectionMethod<T extends Ark.StoredConnection = Ark.StoredConnection> {
	(key: keyof T, value: T[keyof T]): void;
	(key: `host.${number}`, value: { host?: string; port?: number }): void;
}

export interface ConnectionFormProps {
	connectionParams?: Ark.StoredConnection;
	mode?: "edit" | "clone";
}

export function ConnectionForm(props: ConnectionFormTab): JSX.Element {
	const [type, setType] = useState<FormType>(props.mode === "edit" || props.mode === "clone" ? "advanced" : "basic");

	const [icon, setIcon] = useState<Ark.StoredIcon>();

	const editConnection = useCallback<EditConnectionMethod>(function (key, value) {
		if (key.startsWith("host.")) {
			const idx: number = key.split(".")[1];
			setConnectionData((conn) => {
				const hosts = conn.hosts;
				hosts[idx] = {
					host: value.host || hosts[idx].host || "localhost",
					port: typeof value.port == "number" ? value.port : hosts[idx].port || 27017,
				};
				return { ...conn };
			});
		} else if (key && value !== undefined) {
			setConnectionData((conn) => ({ ...conn, [key]: value }));
		}
	}, []);

	const connectionDetails = props.connectionParams
		? {
				...props.connectionParams,
				id: props.connectionParams && props.mode === "clone" ? "" : props.connectionParams.id,
		  }
		: { ...defaultConnectionSettings() };

	const [mongoURI, setMongoURI] = useState("");
	const [connectionData, setConnectionData] = useState<Ark.StoredConnection>(connectionDetails);

	useEffect(() => {
		if (connectionData.id && connectionData.icon) {
			window.ark.getIcon(connectionData.id).then((icon) => {
				if (icon && icon.name) {
					setIcon(icon);
				}
			});
		}
		/* We just need the icon fetched during the initial render.
		Subsequent updates are being handled within the component */
		/* eslint-disable-next-line */
	}, []);

	useEffect(() => {
		if (!mongoURI) {
			window.ark.driver
				.run("connection", "convertConnectionToUri", {
					config: connectionData,
				})
				.then(({ uri }) => {
					setMongoURI(uri);
				});
		}
		/* eslint-disable-next-line */
	}, []);

	useEffect(() => {
		if (connectionData.password && (props.mode === "edit" || props.mode === "clone")) {
			window.ark.driver
				.run<"decryptPassword">("connection", "decryptPassword", {
					pwd: connectionData.password,
					iv: connectionData.iv || "",
				})
				.then((pwd) => {
					editConnection("password", pwd);
				});
		}
		// We just need to decrypt the password on initial render
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const closeForm = useCallback(() => {
		dispatch("browser:delete_tab:connection_form", { id: props.id });
	}, [props.id]);

	const validateUri = useCallback((uri: string) => {
		try {
			const parsedUri = parse(uri);
			if (
				parsedUri &&
				(parsedUri.scheme === "mongodb" || parsedUri.scheme === "mongodb+srv") &&
				parsedUri.hosts.every((elem) => !!elem.host)
			) {
				return { ok: true };
			}

			return { ok: false, err: "Invalid URI format" };
		} catch (err) {
			return {
				ok: true,
				err: err && (err as Error).message ? (err as Error).message : "Invalid URI",
			};
		}
	}, []);

	const saveMongoURI = useCallback(() => {
		const { ok, err } = validateUri(mongoURI);
		if (ok) {
			window.ark.driver
				.run("connection", "save", {
					type: "uri",
					config: {
						uri: mongoURI,
						name: connectionData.name || "Test Connection " + new Date().valueOf(),
					},
				})
				.then((connectionId) => {
					dispatch("connection_manager:add_connection", { connectionId });
					closeForm();
				});
		} else {
			if (err) {
				notify({
					type: "error",
					description: err,
				});
			} else {
				notify({
					type: "error",
					description: "Validation of inputs failed",
				});
			}
		}
	}, [validateUri, mongoURI, connectionData.name, closeForm]);

	const testURIConnection = useCallback(() => {
		const { ok, err } = validateUri(mongoURI);
		if (ok) {
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
						title: "Connection Test",
						description: res.message,
						type: res.status ? "success" : "error",
					};

					notify(notification);
				});
		} else {
			if (err) {
				notify({
					type: "error",
					description: err,
				});
			} else {
				notify({
					type: "error",
					description: "Validation of inputs failed",
				});
			}
		}
	}, [mongoURI, validateUri]);

	const validateAdvancedConfig = useCallback(() => {
		let msg;
		if (!connectionData.type) {
			msg = "Invalid connection type.";
		} else if (!connectionData.hosts) {
			msg = "Invalid hosts.";
		} else if (connectionData.ssh.useSSH) {
			if (!connectionData.ssh.host || !connectionData.ssh.port || isNaN(Number(connectionData.ssh.port))) {
				msg = "Incorrect ssh host or port format.";
			} else if (
				!connectionData.ssh.mongodHost ||
				!connectionData.ssh.mongodPort ||
				isNaN(Number(connectionData.ssh.mongodPort))
			) {
				msg = "Incorrect mongod host or port.";
			} else if (!connectionData.ssh.username) {
				msg = "Invalid username.";
			} else if (
				(connectionData.ssh.method === "password" && !connectionData.ssh.password) ||
				(connectionData.ssh.method === "privateKey" && !connectionData.ssh.privateKey)
			) {
				msg = "Either the password or the private key must be specified.";
			}
		}

		if (msg) {
			return { ok: false, msg };
		}

		return { ok: true };
	}, [connectionData]);

	const saveAdvancedConnection = useCallback(() => {
		const { ok, msg } = validateAdvancedConfig();
		if (ok) {
			return window.ark.driver.run("connection", "save", {
				type: "config",
				config: {
					...connectionData,
					name: connectionData.name || `Connection ${new Date().valueOf()}`,
				},
				icon: icon,
			});
		} else {
			return Promise.reject(msg);
		}
	}, [connectionData, icon, validateAdvancedConfig]);

	const testAdvancedConnection = useCallback(() => {
		const { ok, msg } = validateAdvancedConfig();
		if (ok) {
			return window.ark.driver.run("connection", "test", {
				type: "config",
				config: {
					...connectionData,
					name: "ark test call",
				},
			});
		} else {
			return Promise.resolve({
				status: false,
				message: msg,
			});
		}
	}, [connectionData, validateAdvancedConfig]);

	const onFormTypeChange = useCallback(
		(type: FormType) => {
			return Promise.resolve()
				.then(() => {
					if (type === "basic") {
						const { ok } = validateAdvancedConfig();
						if (ok) {
							return window.ark.driver
								.run("connection", "convertConnectionToUri", {
									config: connectionData,
								})
								.then(({ uri }) => {
									setMongoURI(uri);
									setType(type);
								});
						}
					} else if (type === "advanced") {
						const { ok } = validateUri(mongoURI);
						if (ok) {
							return window.ark.driver
								.run("connection", "convertUriToConnection", {
									config: {
										uri: mongoURI,
										name: "convert",
									},
								})
								.then(({ connection }) => {
									setConnectionData(connection);
								});
						}
					}
				})
				.finally(() => {
					setType(type);
				});
		},
		[connectionData, mongoURI, validateAdvancedConfig, validateUri],
	);

	return (
		<div className="uri-container">
			<div className="container">
				{type === "basic" && (
					<BasicConnectionForm
						currentName={connectionData?.name || ""}
						currentUri={mongoURI}
						onFormTypeChange={onFormTypeChange}
						onNameChange={(name) => editConnection("name", name)}
						onUriChange={(uri) => setMongoURI(uri)}
						onTestConnection={() => testURIConnection()}
						onSaveConnection={() => saveMongoURI()}
					/>
				)}
				{type === "advanced" && (
					<AdvancedConnectionForm
						connectionData={connectionData}
						editConnection={editConnection}
						icon={icon}
						onIconChange={(icon) => setIcon(icon)}
						onFormTypeChange={onFormTypeChange}
						onTestConnection={{
							promise: () => testAdvancedConnection(),
							callback: (err, res) => {
								if (err) {
									console.log(err);
									notify({
										type: "error",
										description: "Something went wrong!",
									});
									return;
								} else if (res) {
									const notification: Parameters<typeof notify>[0] = {
										title: "Test connection",
										description: res.message,
										type: res.status ? "success" : "error",
									};

									notify(notification);
								}
							},
						}}
						onSaveConnection={{
							promise: () => saveAdvancedConnection(),
							callback: (err, res) => {
								if (err) {
									console.log(err);
									notify({
										type: "error",
										description: "Something went wrong!",
									});
									return;
								} else {
									const connectionId = res;
									dispatch("connection_manager:add_connection", { connectionId });
									closeForm();
								}
							},
						}}
					/>
				)}
			</div>
		</div>
	);
}
