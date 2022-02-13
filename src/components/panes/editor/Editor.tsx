import React, { FC, useState, useEffect, useCallback, useContext } from "react";
import { deserialize, ObjectId } from "bson";
import "../styles.less";
import { MONACO_COMMANDS, Shell } from "../../shell/Shell";
import { Resizable } from "re-resizable";
import { Menu, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
	VscGlobe,
	VscDatabase,
	VscAccount,
	VscSaveAs,
	VscSave,
	VscClose,
	VscPlay,
} from "react-icons/vsc";

import { dispatch, listenEffect } from "../../../common/utils/events";
import {
	getConnectionUri,
	handleErrors,
	notify,
} from "../../../common/utils/misc";
import { ResultViewer, ResultViewerProps } from "./ResultViewer/ResultViewer";
import { Button } from "../../../common/components/Button";
import { CircularLoading } from "../../../common/components/Loading";
import { useRefresh } from "../../../hooks/useRefresh";
import { bsonTest } from "../../../../util/misc";
import { BSONType } from "mongodb";
import { SettingsContext } from "../../../App";

dayjs.extend(utc);
dayjs.extend(timezone);

const createDefaultCodeSnippet = (collection: string) => `// Mongo shell
db.getCollection('${collection}').find({});
`;

interface ReplicaSetMember {
	name: string;
	health: number;
	state: number;
	stateStr: "PRIMARY" | "SECONDARY";
}

export interface EditorProps {
	shellConfig: Ark.ShellConfig;
	storedConnectionId: string;
	contextDB: string;
	collections: string[];
	initialCode?: string;
	scriptId?: string;
	/** Browser tab id */
	id: string;
}

export const Editor: FC<EditorProps> = (props) => {
	const {
		shellConfig,
		contextDB,
		id: TAB_ID,
		collections: COLLECTIONS,
		storedConnectionId,
		initialCode,
		scriptId,
	} = props;

	const { collection, username: user, uri, hosts } = shellConfig || {};

	const { settings } = useContext(SettingsContext);

	const [effectRefToken, refreshEffect] = useRefresh();
	const [executing, setExecuting] = useState(false);
	const [currentResult, setCurrentResult] = useState<ResultViewerProps>();
	const [savedScriptId, setSavedScriptId] = useState<string | undefined>(
		scriptId
	);
	const [shellId, setShellId] = useState<string>();
	const [currentReplicaHost, setCurrentReplicaHost] =
		useState<ReplicaSetMember>();
	const [replicaHosts, setReplicaHosts] = useState<ReplicaSetMember[]>();
	const [code, setCode] = useState(() =>
		initialCode
			? initialCode
			: collection
			? createDefaultCodeSnippet(collection)
			: createDefaultCodeSnippet("test")
	);

	const onCodeChange = useCallback((code: string) => {
		const _code = code.replace(/(\/\/.*)|(\n)/g, "");
		setCode(_code);
	}, []);

	const switchViews = useCallback((type: "tree" | "json") => {
		setCurrentResult((currentResult) => ({
			...currentResult,
			type: type,
			bson: currentResult?.bson || [],
		}));
	}, []);

	const applyTimezone = (result: Ark.BSONArray, timezone: string) => {
		const recursivelyFormat = (res: Ark.BSONArray[0]) =>
			res
				? Object.keys(res).reduce((acc, key) => {
						if (acc[key] instanceof Date) {
							acc[key] = `ISODate("${dayjs
								.utc(acc[key] as Date)
								.tz(timezone)
								.format()}")`;
						} else if (Array.isArray(acc[key])) {
							acc[key] = (acc[key] as Array<Ark.BSONArray[0]>).map((elem) =>
								typeof elem === "object" ? recursivelyFormat(elem) : elem
							);
						} else if (
							typeof acc[key] === "object" &&
							!ObjectId.isValid(acc[key] as BSONType)
						) {
							acc[key] = recursivelyFormat(acc[key] as Ark.BSONArray[0]);
						}

						return acc;
				  }, res)
				: res;

		return result.map((res) => (res ? recursivelyFormat(res) : res));
	};

	const exec = useCallback(
		(code) => {
			const _code = code.replace(/(\/\/.*)|(\n)/g, "");
			console.log(`executing ${shellId} code`);
			setExecuting(true);
			shellId
				? window.ark.shell
						.eval(shellId, _code, storedConnectionId)
						.then(function ({ result, err }) {
							if (err) {
								console.log("exec shell");
								console.log(err);
								// setTextResult(msg + "<br/>" + html);
								return;
							}

							const bson = deserialize(result ? result : Buffer.from([]));

							const bsonArray: Ark.BSONArray = bsonTest(bson)
								? Object.values(bson)
								: [bson];

							setCurrentResult({
								type: "tree",
								bson:
									settings && settings.timezone && settings.timezone === "local"
										? applyTimezone(bsonArray, dayjs.tz.guess())
										: bsonArray,
							});
						})
						.catch(function (err) {
							console.error("exec shell error: ", err);
							handleErrors(err, storedConnectionId);
						})
						.finally(() => setExecuting(false))
				: setExecuting(false);
		},
		[settings, shellId, storedConnectionId]
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
					id: storedConnectionId,
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
						.create(uri, contextDB, storedConnectionId)
						.then(({ id }) => {
							console.log(
								`[switch replica] created shell ${id} ${member.name} ${member.stateStr}`
							);
							setShellId(id);
							setCurrentReplicaHost(member);
						});
				});
		},
		[contextDB, storedConnectionId]
	);
	const exportData = useCallback(
		(code, options) => {
			const _code = code.replace(/(\/\/.*)|(\n)/g, "");
			shellId &&
				window.ark.shell
					.export(shellId, _code, storedConnectionId, options)
					.then(() => {
						console.log("Export complete");
						notify({
							title: "Export complete!",
							description: `Path: ~/.ark/exports/${options.fileName}`,
							type: "success",
						});
					})
					.catch((err) => {
						notify({
							title: "Export failed!",
							description: err.message || err,
							type: "error",
						});
						console.error("exec shell error: ", err);
					});
		},
		[shellId, storedConnectionId]
	);

	const terminateExecution = useCallback(() => {
		if (shellId) return destroyShell(shellId).then(() => refreshEffect());
	}, [destroyShell, refreshEffect, shellId]);

	useEffect(() => {
		if (contextDB && storedConnectionId) {
			console.log("[editor onload]", shellId);
			if (hosts && hosts.length > 1) {
				console.log("[editor onload] multi-host");
				window.ark.driver
					.run("connection", "info", {
						id: storedConnectionId,
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
					window.ark.shell.create(uri, contextDB, storedConnectionId),
					window.ark.driver.run("connection", "info", {
						id: storedConnectionId,
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
		return () => {
			if (shellId) destroyShell(shellId);
		};
	}, [
		contextDB,
		uri,
		storedConnectionId,
		hosts,
		switchReplicaShell,
		effectRefToken,
	]);

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
				defaultSize={{ height: "300px", width: "100%" }}
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
					<Button
						size="small"
						icon={<VscSaveAs />}
						onClick={() => {
							window.ark
								.browseForDirs("Select A Save Location", "Set")
								.then((result) => {
									const { dirs } = result;
									const saveLocation = dirs[dirs.length - 1];
									return window.ark.scripts
										.saveAs({
											code,
											saveLocation,
											storedConnectionId: storedConnectionId,
											fileName: "saved-script-1.js",
										})
										.then((script) => {
											setSavedScriptId(script.id);
										});
								});
						}}
						popoverOptions={{
							hover: {
								content: "Save as",
							},
						}}
					/>
					{savedScriptId && (
						<Button
							size="small"
							icon={<VscSave />}
							onClick={() => {
								return window.ark.scripts
									.save({
										code,
										id: savedScriptId,
									})
									.then((script) => {
										setSavedScriptId(script.id);
									});
							}}
							popoverOptions={{
								hover: {
									content: "Save",
								},
							}}
						/>
					)}
					{!executing && (
						<Button
							size="small"
							icon={<VscPlay />}
							variant="success"
							onClick={() => exec(code)}
							popoverOptions={{
								hover: {
									content: "Run",
								},
							}}
						/>
					)}
					{executing && (
						<Button
							size="small"
							icon={<VscClose />}
							variant="danger"
							onClick={() => terminateExecution()}
							popoverOptions={{
								hover: {
									content: "Stop",
								},
							}}
						/>
					)}
				</div>
				{shellId ? (
					<Shell
						code={code}
						onCodeChange={onCodeChange}
						allCollections={COLLECTIONS} // @todo: Fetch these collection names
						onMonacoCommand={(command) => {
							switch (command) {
								case MONACO_COMMANDS.CLONE_SHELL: {
									dispatch("browser:create_tab:editor", {
										shellConfig,
										contextDB,
										collections: COLLECTIONS,
										storedConnectionId,
									});
									return;
								}
								case MONACO_COMMANDS.EXEC_CODE: {
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
						<CircularLoading />
					</div>
				)}
			</Resizable>
			{currentResult && (
				<ResultViewer
					{...currentResult}
					code={code}
					switchViews={switchViews}
					onExport={(params) => exportData(params.code, params.options)}
				/>
			)}
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
