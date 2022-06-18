import React, { FC, useState, useEffect, useCallback, useMemo } from "react";
import { deserialize } from "bson";
import "../styles.less";
import { MONACO_COMMANDS, Shell } from "../../shell/Shell";
import { Resizable } from "re-resizable";

import { dispatch, listenEffect } from "../../../common/utils/events";
import { handleErrors, notify } from "../../../common/utils/misc";
import { ResultViewer, ResultViewerProps } from "./result-viewer/ResultViewer";
import { Button } from "../../../common/components/Button";
import { CircularLoading } from "../../../common/components/Loading";
import { useRefresh } from "../../../hooks/useRefresh";
import { bsonTest } from "../../../../util/misc";
import { useContext } from "react";
import { SettingsContext } from "../../layout/BaseContextProvider";
import {
	FormGroup,
	Icon,
	Menu,
	InputGroup,
	MenuItem,
	Radio,
	RadioGroup,
	Switch,
	Tag,
	TextArea,
} from "@blueprintjs/core";
import { Dialog } from "../../../common/components/Dialog";
import { Popover2 } from "@blueprintjs/popover2";

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
	const [initialRender, setInitialRender] = useState<boolean>(true);

	const [queryParams, setQueryParams] = useState<Ark.QueryOptions>({
		page: 1,
		limit: 50,
		timeout: settings?.shellTimeout,
	});

	const [effectRefToken, refreshEffect] = useRefresh();
	const [executing, setExecuting] = useState(false);
	const [currentResult, setCurrentResult] =
		useState<Partial<ResultViewerProps>>();
	const [savedScriptId, setSavedScriptId] = useState<string | undefined>(
		scriptId
	);
	const [shellId, setShellId] = useState<string>();
	const [shellLoadError, setShellLoadError] = useState<string>();
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
	const [exportDialog, toggleExportDialog] = useState<boolean>(false);
	const [exportOptions, setExportOptions] = useState<
		Ark.ExportNdjsonOptions | Ark.ExportCsvOptions
	>({
		type: "NDJSON",
		fileName: "",
	});

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

	const changeQueryParams = useCallback(
		(type: Exclude<keyof Ark.QueryOptions, "timeout">, value: number) => {
			setInitialRender(false);
			setQueryParams((params) => ({
				...params,
				[type]: value,
			}));
		},
		[]
	);

	const exec = useCallback(
		(code) => {
			const _code = code.replace(/(\/\/.*)|(\n)/g, "");
			console.log(`executing ${shellId} code`);
			setExecuting(true);
			setCurrentResult(undefined);
			shellId
				? window.ark.shell
						.eval(shellId, _code, queryParams)
						.then(function ({ editable, result, err }) {
							if (err) {
								console.log("exec shell");
								console.log(err);
								// setTextResult(msg + "<br/>" + html);
								return;
							}

							if (result) {
								const bson = deserialize(result ? result : Buffer.from([]));

								const bsonArray: Ark.BSONArray = bsonTest(bson)
									? Object.values(bson)
									: [bson];

								setCurrentResult({
									type: "tree",
									bson: bsonArray,
									allowDocumentEdits: editable,
								});
							} else {
								notify({
									title: "Error",
									description: "Did not get result from main process.",
									type: "error",
								});
							}
						})
						.catch(function (err) {
							console.error("exec shell error: ", err);
							handleErrors(err, storedConnectionId);
						})
						.finally(() => setExecuting(false))
				: setExecuting(false);
		},
		[shellId, storedConnectionId, queryParams]
	);

	const destroyShell = useCallback(
		(shellId: string) =>
			window.ark.shell.destroy(shellId).then(() => setShellId(undefined)),
		[]
	);

	const switchReplicaShell = useCallback(
		(member: ReplicaSetMember) => {
			console.log(
				`[switch replica] creating shell ${member.name} ${member.stateStr}`
			);
			return window.ark.shell
				.create(contextDB, storedConnectionId)
				.then(({ id }) => {
					console.log(
						`[switch replica] created shell ${id} ${member.name} ${member.stateStr}`
					);
					setShellId(id);
					setCurrentReplicaHost(member);
				});
		},
		[contextDB, storedConnectionId]
	);
	const exportData = useCallback(
		(code, options) => {
			const _code = code.replace(/(\/\/.*)|(\n)/g, "");
			shellId &&
				window.ark.shell
					.export(shellId, _code, options)
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
		[shellId]
	);

	const terminateExecution = useCallback(() => {
		if (shellId) return destroyShell(shellId).then(() => refreshEffect());
	}, [destroyShell, refreshEffect, shellId]);

	const changeExportOptions = useCallback(
		(option: "fields" | "destructure" | "type" | "fileName", e?: any) => {
			if (option === "type") {
				if (e.target.value === "CSV") {
					setExportOptions((options) => ({
						...options,
						type: "CSV",
						destructureData: false,
						fields: [],
					}));
				} else if (e.target.value === "NDJSON") {
					setExportOptions((options) => ({
						fileName: options.fileName,
						type: "NDJSON",
					}));
				}
			} else if (option === "destructure") {
				setExportOptions((options) => ({
					...options,
					destructureData:
						options.type === "CSV" ? !options.destructureData : false,
				}));
			} else if (option === "fileName") {
				setExportOptions((options) => ({
					...options,
					fileName: e.target.value,
				}));
			} else {
				setExportOptions((options) => ({
					...options,
					fields:
						options.type === "CSV"
							? e.target.value.split(",").map((field) => field.trim())
							: undefined,
				}));
			}
		},
		[]
	);

	useEffect(() => {
		if (queryParams && !initialRender) {
			exec(code);
		}

		/* Just need these dependencies for code to re-execute
			when either the page or the limit is changed */
	}, [queryParams, initialRender]);

	useEffect(() => {
		if (settings?.shellTimeout) {
			setQueryParams((params) => ({
				...params,
				timeout: settings.shellTimeout,
			}));
		}
	}, [settings?.shellTimeout]);

	useEffect(() => {
		if (contextDB && storedConnectionId) {
			setShellLoadError(undefined);
			Promise.resolve()
				.then(() => {
					console.log("[editor onload]", shellId);
					if (hosts && hosts.length > 1) {
						console.log("[editor onload] multi-host");
						return window.ark.driver
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
										setReplicaHosts(
											() => connection.replicaSetDetails?.members
										);
										switchReplicaShell(primary);
									} else {
										console.error("NO PRIMARY");
									}
								}
							});
					} else {
						console.log("[editor onload] single-host");
						return Promise.all([
							window.ark.shell.create(contextDB, storedConnectionId),
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
				})
				.catch(function (err) {
					console.log(err);
					if (err.message.startsWith("No mem entry found for id")) {
						setShellLoadError(
							"Unable to load the editor, connection was not made."
						);
					} else {
						setShellLoadError(
							`Something unexpected happened when loading the editor.\nError: ${err.message}`
						);
					}
				});
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
		// shellId, // Causes infinite re-renders @todo: fix
		destroyShell,
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
		<>
			<div className={"editor"}>
				<Resizable
					minHeight={
						currentResult && currentResult.bson && currentResult.type
							? "250px"
							: "100%"
					}
					defaultSize={{
						height: "250px",
						width: "100%",
					}}
					enable={{ bottom: true }}
				>
					<div className={"editor-header"}>
						<div className={"editor-header-item"}>
							{!!replicaHosts && !!currentReplicaHost ? (
								<HostList
									currentHost={currentReplicaHost}
									hosts={replicaHosts}
									onHostChange={(host) => {
										if (host.name !== currentReplicaHost.name) {
											(shellId
												? destroyShell(shellId)
												: Promise.resolve()
											).then(() => switchReplicaShell(host));
										}
									}}
								/>
							) : (
								<Tag icon={"globe-network"} round>
									{hosts[0]}
								</Tag>
							)}
						</div>
						<div className={"editor-header-item"}>
							<Tag icon={"database"} round>
								{contextDB}
							</Tag>
						</div>
						<div className={"editor-header-item"}>
							<Tag icon={"person"} round>
								{user || "(no auth)"}
							</Tag>
						</div>
						{shellId && !shellLoadError && (
							<>
								<div className={"editor-header-item"}>
									<Button
										size="small"
										icon={"floppy-disk"}
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
										tooltipOptions={{
											position: "bottom",
											content: "Save as",
										}}
									/>
								</div>

								{savedScriptId && (
									<div className={"editor-header-item"}>
										<Button
											size="small"
											icon={"saved"}
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
											tooltipOptions={{
												position: "bottom",
												content: "Save",
											}}
										/>
									</div>
								)}
								{!executing && (
									<div className={"editor-header-item"}>
										<Button
											size="small"
											icon={"play"}
											onClick={() => exec(code)}
											tooltipOptions={{
												position: "bottom",
												content: "Run",
											}}
										/>
									</div>
								)}
								{executing && (
									<Button
										size="small"
										icon={"stop"}
										variant="danger"
										onClick={() => terminateExecution()}
										tooltipOptions={{
											position: "bottom",
											content: "Stop",
										}}
									/>
								)}
								<div className="editor-header-item">
									<Button
										size="small"
										icon={"export"}
										onClick={() => toggleExportDialog(true)}
										tooltipOptions={{
											position: "bottom",
											content: "Export data",
										}}
									/>
								</div>
							</>
						)}
					</div>
					{shellId ? (
						<Shell
							code={code}
							onCodeChange={onCodeChange}
							allCollections={COLLECTIONS} // @todo: Fetch these collection names
							settings={settings}
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
							{shellLoadError ? shellLoadError : <CircularLoading />}
						</div>
					)}
				</Resizable>
				{currentResult && currentResult.bson && currentResult.type && (
					<ResultViewer
						bson={currentResult.bson}
						type={currentResult.type}
						allowDocumentEdits={currentResult.allowDocumentEdits}
						shellConfig={{ ...shellConfig, database: contextDB }}
						driverConnectionId={storedConnectionId}
						switchViews={switchViews}
						paramsState={{ queryParams, changeQueryParams }}
						onRefresh={() => {
							exec(code);
						}}
						onClose={() => {
							setCurrentResult(undefined);
						}}
					/>
				)}
			</div>
			{/* Dialogs */}
			<>
				{exportDialog && (
					<Dialog
						size={"small"}
						title={"Run Export"}
						onConfirm={() => {
							exportData(code, exportOptions);
							toggleExportDialog(false);
							setExportOptions({
								type: "NDJSON",
								fileName: "",
							});
						}}
						onCancel={() => toggleExportDialog(false)}
					>
						<div className={"export-options"}>
							<div className={"export-type"}>
								<RadioGroup
									label="Export as"
									selectedValue={exportOptions.type}
									onChange={(e) => {
										changeExportOptions("type", e);
									}}
								>
									<Radio label="CSV" value="CSV" />
									<Radio label="NDJSON" value="NDJSON" />
								</RadioGroup>
							</div>
							<div className={"export-type"}>
								<FormGroup label="Output destination">
									<InputGroup
										value={exportOptions.fileName}
										onChange={(e) => changeExportOptions("fileName", e)}
									/>
								</FormGroup>
							</div>
							{exportOptions.type === "CSV" && (
								<div>
									<FormGroup inline label="Destructure data">
										<Switch
											checked={!!exportOptions.destructureData}
											onChange={() => changeExportOptions("destructure")}
										/>
									</FormGroup>
									<FormGroup label="Fields">
										<TextArea
											value={exportOptions.fields?.join(",")}
											onChange={(e) => changeExportOptions("fields", e)}
										/>
									</FormGroup>
								</div>
							)}
						</div>
					</Dialog>
				)}
			</>
		</>
	);
};

interface CreateMenuItem {
	item: string;
	cb: () => void;
	active: boolean;
}
const createMenu = (items: CreateMenuItem[]) => (
	<Menu>
		{items.map((menuItem, i) => (
			<MenuItem
				disabled={menuItem.active}
				text={menuItem.item}
				key={i}
				onClick={() => menuItem.cb()}
			/>
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
		<Popover2
			position="bottom-right"
			content={createMenu(
				hosts.map((host) => ({
					item: `${host.name} (${host.stateStr.substring(0, 1)})`,
					cb: () => onHostChange(host),
					active: currentHost.name === host.name,
				}))
			)}
		>
			<Tag icon={"globe-network"} interactive round>
				{currentHost.name +
					" " +
					"(" +
					currentHost.stateStr.substring(0, 1) +
					")"}
			</Tag>
		</Popover2>
	);
};
