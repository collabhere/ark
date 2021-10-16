import React, { FC, useState, useEffect, useCallback, useMemo } from "react";
import { deserialize } from "bson";
import "../styles.less";
import { MONACO_COMMANDS, Shell } from "../../shell/Shell";
import { Resizable } from "re-resizable";
import { Menu, Dropdown, Spin, Space } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { VscGlobe, VscDatabase, VscAccount } from "react-icons/vsc";
import { LoadingOutlined } from "@ant-design/icons";

import { dispatch, listenEffect } from "../../../util/events";
import { getConnectionUri } from "../../../common/util";

const createDefaultCodeSnippet = (collection: string) => `// Mongo shell
db.getCollection('${collection}').find({});
`;

interface ReplicaSetMember {
	name: string;
	health: number;
	state: number;
	stateStr: "PRIMARY" | "SECONDARY";
}

export interface TreeViewerProps {
	json: Ark.AnyObject;
}

const TreeViewer: FC<TreeViewerProps> = (props) => {
	const { json } = props;
	return <div></div>;
};

export interface TextViewerProps {
	text: string | React.ReactNode;
}
const TextViewer: FC<TextViewerProps> = (props) => {
	const { text } = props;
	return typeof text == "string" ? (
		<div dangerouslySetInnerHTML={{ __html: text }}></div>
	) : (
		<div>{text}</div>
	);
};

interface JSONViewerProps {
	json: Ark.AnyObject;
}

const JSONViewer: FC<JSONViewerProps> = (props) => {
	const { json } = props;
	return (
		<>
			{Array.isArray(json) ? (
				json.map((doc, i) => (
					<div key={i}>
						<div>{"// " + (i + 1)}</div>
						<p>{JSON.stringify(doc, null, 4)}</p>
						<br />
					</div>
				))
			) : Object.keys(json)[0] === "0" ? (
				Object.values(json).map((doc, i) => (
					<div key={i}>
						<div>{"// " + (i + 1)}</div>
						<p>{JSON.stringify(doc, null, 4)}</p>
						<br />
					</div>
				))
			) : (
				<div>{JSON.stringify(json, null, 4)}</div>
			)}
		</>
	);
};

type ResultViewerProps =
	| { type: "json"; json: Ark.AnyObject }
	| { type: "text"; text: string | React.ReactNode }
	| { type: "tree"; tree: Ark.AnyObject };

export const ResultViewer: FC<ResultViewerProps> = (props) => {
	return (
		<div className="ResultViewerContainer">
			{props.type === "json" ? (
				<JSONViewer json={props[props.type]} />
			) : props.type === "text" ? (
				<TextViewer text={props[props.type]} />
			) : props.type === "tree" ? (
				<TreeViewer json={props[props.type]} />
			) : (
				<div>{"Incorrect view type!"}</div>
			)}
		</div>
	);
};

export interface EditorProps {
	shellConfig: Ark.ShellConfig;
	driverConnectionId: string;
	contextDB: string;
	collections: string[];
	/** Browser tab id */
	id: string;
}

export const Editor: FC<EditorProps> = (props) => {
	const {
		shellConfig,
		contextDB,
		id: TAB_ID,
		collections: COLLECTIONS,
		driverConnectionId,
	} = props;

	const { collection, username: user, uri, hosts } = shellConfig || {};

	const [currentResult, setCurrentResult] = useState<ResultViewerProps>();
	const [shellId, setShellId] = useState<string>();
	const [currentReplicaHost, setCurrentReplicaHost] =
		useState<ReplicaSetMember>();
	const [replicaHosts, setReplicaHosts] = useState<ReplicaSetMember[]>();
	const code = useMemo(
		() =>
			collection
				? createDefaultCodeSnippet(collection)
				: createDefaultCodeSnippet("test"),
		[collection]
	);

	const exec = useCallback(
		(code) => {
			const _code = code.replace(/(\/\/.*)|(\n)/g, "");
			console.log(`executing ${shellId} code`);
			shellId &&
				window.ark.shell
					.eval(shellId, _code)
					.then(function ({ result, err }) {
						if (err) {
							console.log("exec shell");
							console.log(err);
							// setTextResult(msg + "<br/>" + html);
							return;
						}
						const json = deserialize(result ? result : Buffer.from([]));
						console.log("RESULT", json);
						setCurrentResult({
							type: "json",
							json,
						});
					})
					.catch(function (err) {
						console.error("exec shell error: ", err);
					});
		},
		[shellId]
	);

	const destroyShell = useCallback(
		(shellId: string) =>
			window.ark.shell.destroy(shellId).then(() => setShellId(undefined)),
		[]
	);

	const switchReplicaShell = useCallback(
		(member: ReplicaSetMember) => {
			console.log(`[switch replica] ${member.name} ${member.stateStr}`);
			return window.ark.driver
				.run("connection", "load", {
					id: driverConnectionId,
				})
				.then((storedConnection) => {
					const uri = getConnectionUri({
						...storedConnection,
						hosts: [member.name],
					});
					console.log(
						`[switch replica] creating shell ${member.name} ${member.stateStr}`
					);
					return window.ark.shell
						.create(uri, contextDB, driverConnectionId)
						.then(({ id }) => {
							console.log(
								`[switch replica] created shell ${id} ${member.name} ${member.stateStr}`
							);
							setShellId(id);
							setCurrentReplicaHost(member);
						});
				});
		},
		[contextDB, driverConnectionId]
	);

	useEffect(() => {
		if (contextDB && driverConnectionId) {
			console.log("[editor onload]");
			if (hosts && hosts.length > 1) {
				console.log("[editor onload] multi-host");
				window.ark.driver
					.run("connection", "info", {
						id: driverConnectionId,
					})
					.then((connection) => {
						if (connection.replicaSetDetails) {
							console.log("[editor onload] multi-host replica set");
							const primary = connection.replicaSetDetails.members.find(
								(x) => x.stateStr === "PRIMARY"
							);
							if (primary) {
								setReplicaHosts(() => connection.replicaSetDetails?.members);
								switchReplicaShell(primary);
							} else {
								console.error("NO PRIMARY");
							}
						} else {
							// Multi-host standalone? not possible
						}
					});
			} else {
				console.log("[editor onload] single-host");
				Promise.all([
					window.ark.shell.create(uri, contextDB, driverConnectionId),
					window.ark.driver.run("connection", "info", {
						id: driverConnectionId,
					}),
				]).then(([{ id }, connection]) => {
					console.log("[editor onload] single-host shell created - " + id);
					setShellId(id);
					// incase of single node replica set
					connection.replicaSetDetails &&
						setReplicaHosts(() => connection.replicaSetDetails?.members);
				});
			}
		}
	}, [contextDB, uri, driverConnectionId, hosts, switchReplicaShell]);

	/** Register browser event listeners */
	useEffect(
		() =>
			listenEffect([
				{
					event: "browser:delete_tab:editor",
					cb: (e, payload) => {
						if (payload.id === TAB_ID && shellId) {
							destroyShell(shellId);
						}
					},
				},
			]),
		[TAB_ID, destroyShell, shellId]
	);

	return (
		<div className={"Editor"}>
			<Resizable
				// minHeight={"20%"}
				maxHeight={"40%"}
				defaultSize={{ height: "20%", width: "100%" }}
				enable={{ bottom: true }}
			>
				<div className={"EditorHeader"}>
					<div className={"EditorHeaderItem"}>
						<span>
							<VscGlobe />
						</span>
						{replicaHosts && currentReplicaHost ? (
							<HostList
								currentHost={currentReplicaHost}
								hosts={replicaHosts}
								onHostChange={(host) => {
									if (host.name !== currentReplicaHost.name) {
										(shellId ? destroyShell(shellId) : Promise.resolve()).then(
											() => switchReplicaShell(host)
										);
									}
								}}
							/>
						) : (
							<span>{hosts[0]}</span>
						)}
					</div>
					<div className={"EditorHeaderItem"}>
						<span>
							<VscDatabase />
						</span>
						<span>{contextDB}</span>
					</div>
					<div className={"EditorHeaderItem"}>
						<span>
							<VscAccount />
						</span>
						<span>{user || "no user"}</span>
					</div>
				</div>
				{shellId ? (
					<Shell
						initialCode={code}
						allCollections={COLLECTIONS}
						onMonacoCommand={(command, params) => {
							switch (command) {
								case MONACO_COMMANDS.CLONE_SHELL: {
									dispatch("browser:create_tab:editor", {
										shellConfig,
										contextDB,
										collections: COLLECTIONS,
										driverConnectionId,
									});
									return;
								}
								case MONACO_COMMANDS.EXEC_CODE: {
									const { code } = params;
									exec(code);
								}
							}
						}}
					/>
				) : (
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
						}}
					>
						<Space align={"center"} size="middle">
							<Spin indicator={<LoadingOutlined />} size="large" />
						</Space>
					</div>
				)}
			</Resizable>
			{currentResult && <ResultViewer {...currentResult} />}
		</div>
	);
};

interface CreateMenuItem {
	item: string;
	cb: () => void;
}
const createMenu = (items: CreateMenuItem[]) => (
	<Menu>
		{items.map((menuItem, i) => (
			<Menu.Item key={i} onClick={() => menuItem.cb()}>
				<a>{menuItem.item}</a>
			</Menu.Item>
		))}
	</Menu>
);

interface HostListProps {
	currentHost: ReplicaSetMember;
	hosts: ReplicaSetMember[];
	onHostChange: (host: ReplicaSetMember) => void;
}
const HostList = (props: HostListProps) => {
	const { currentHost, hosts, onHostChange } = props;

	return (
		<Dropdown
			overlay={createMenu(
				hosts.map((host) => ({
					item: `${host.name} (${host.stateStr.substr(0, 1)})`,
					cb: () => onHostChange(host),
				}))
			)}
			trigger={["click"]}
		>
			<a style={{ display: "flex" }} onClick={(e) => e.preventDefault()}>
				{currentHost.name} ({currentHost.stateStr.substr(0, 1)})
				<DownOutlined />
			</a>
		</Dropdown>
	);
};
