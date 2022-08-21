import "./styles.less";

import { Icon, IconSize, Intent, SpinnerSize, Tree } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { CollectionInfo, ListDatabasesResult } from "mongodb";
import { Resizable } from "re-resizable";
import React, { FC, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Button } from "../../common/components/Button";
import { ContextMenu } from "../../common/components/ContextMenu";
import { DropdownMenu } from "../../common/components/DropdownMenu";
import { CircularLoading } from "../../common/components/Loading";
import { dispatch, listenEffect } from "../../common/utils/events";
import { handleErrors, notify } from "../../common/utils/misc";
import { useTree } from "../../hooks/useTree";
import { DangerousActionPrompt } from "../dialogs/DangerousActionPrompt";
import { TextInputPrompt } from "../dialogs/TextInputPrompt";
import { SettingsContext } from "../layout/BaseContextProvider";

type Databases = ListDatabasesResult["databases"];
type DatabasesWithInformation = (ListDatabasesResult["databases"][0] & {
	system: boolean;
	collections?: CollectionInfo[];
	key: string;
})[];
interface DatabaseList {
	system: DatabasesWithInformation;
	personal: DatabasesWithInformation;
}

type CachedTrees = Record<string, { dbList: DatabaseList; connection: Ark.StoredConnection }>;

const dbTreeKey = (dbName: string) => "database:" + dbName;
const collectionTreeKey = (collectionName: string, dbName: string) => "collection:" + collectionName + ";" + dbName;
const readKey = (key: string) => {
	const [type, rhs] = key.split(":");
	const [value, ctx] = rhs.split(";");
	return { type, value, ctx };
};
const isSystemDatabase = (name: string) => /(admin|local|config)/i.test(name);

const createDatabaseList = (databases: Databases): DatabaseList => {
	const personal: DatabasesWithInformation = [];
	const system: DatabasesWithInformation = [];
	for (const db of databases) {
		if (isSystemDatabase(db.name)) {
			system.push({
				...db,
				key: dbTreeKey(db.name),
				system: true,
			});
		} else {
			personal.push({
				...db,
				key: dbTreeKey(db.name),
				system: false,
			});
		}
	}
	return {
		system,
		personal: personal.sort((a, b) => (a.name > b.name ? 1 : -1)),
	};
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ExplorerProps {}

export const Explorer: FC<ExplorerProps> = () => {
	const { currentSidebarOpened } = useContext(SettingsContext);
	const [storedConnectionId, setStoredConnectionId] = useState<string>();
	const storedConnectionIdRef = useRef(storedConnectionId);
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const [createCollectionDialogInfo, setCreateCollectionDialogInfo] = useState({
		database: "",
		visible: false,
	});
	const [dropCollectionDialogInfo, setDropCollectionDialogInfo] = useState({
		visible: false,
		database: "",
		collection: "",
	});
	const [createDatabaseDialogInfo, setCreateDatabaseDialogInfo] = useState({
		visible: false,
	});
	const [dropDatabaseDialogInfo, setDropDatabaseDialogInfo] = useState({
		visible: false,
		database: "",
	});
	const [cachedConnections, setCachedConnections] = useState<CachedTrees>({});

	const { tree, updateNodeProperties, createNode, addNodeAtEnd, dropTree } = useTree();

	const updateCachedConnection = useCallback(
		(storedConnection: Ark.StoredConnection, dbList: DatabaseList) => {
			setCachedConnections((map) =>
				storedConnectionId
					? {
							...map,
							[storedConnectionId]: {
								dbList,
								connection: storedConnection,
							},
					  }
					: map,
			);
		},
		[storedConnectionId],
	);

	const updateCachedConnectionDBListEntry = useCallback(
		(dbName: string, collections: CollectionInfo[]) => {
			if (storedConnectionId && cachedConnections[storedConnectionId]) {
				const cacheEntry = cachedConnections[storedConnectionId];
				const dbType = isSystemDatabase(dbName) ? "system" : "personal";
				const list = cacheEntry.dbList[dbType];
				const idx = list.findIndex((db) => db.name === dbName);

				if (idx > -1) {
					list[idx].collections = collections;
					updateCachedConnection(cacheEntry.connection, cacheEntry.dbList);
				}
			}
		},
		[cachedConnections, storedConnectionId, updateCachedConnection],
	);

	const switchConnections = useCallback((args: { connectionId: string }) => {
		const { connectionId } = args;
		setStoredConnectionId(connectionId);
	}, []);

	const setDatabaseNodeLoading = useCallback(
		(key: string, loading: boolean) => {
			updateNodeProperties(key, {
				icon: loading ? (
					<CircularLoading size={SpinnerSize.SMALL} />
				) : (
					<Icon icon={IconNames.Database} className="node-icon" />
				),
				disabled: loading,
			});
		},
		[updateNodeProperties],
	);

	const openShell = useCallback(
		(db: string, collection?: string) => {
			storedConnectionId &&
				Promise.all([
					window.ark.driver.run("connection", "load", {
						id: storedConnectionId,
					}),
					window.ark.driver.run("database", "listCollections", {
						id: storedConnectionId,
						database: db,
					}),
				]).then(([storedConnection, collections]) => {
					dispatch("browser:create_tab:editor", {
						shellConfig: { ...storedConnection, collection },
						contextDB: db,
						collections: collections.map((col) => col.name),
						storedConnectionId: storedConnectionId,
					});
				});
		},
		[storedConnectionId],
	);

	const setCollectionListToTree = useCallback(
		(db: string, collections: CollectionInfo[]) => {
			const children = collections.map((collection) => {
				return createNode(
					<div className="node">
						<ContextMenu
							items={[
								{
									item: "Open shell",
									cb: () => openShell(db, collection.name),
								},
								{ item: "Indexes", cb: () => {} },
								{
									intent: Intent.DANGER,
									item: "Drop collection",
									cb: () => {
										setDropCollectionDialogInfo({
											database: db,
											collection: collection.name,
											visible: true,
										});
									},
								},
							]}
						>
							<span>{collection.name}</span>
						</ContextMenu>
					</div>,
					collectionTreeKey(collection.name, db),
					[],
					{
						icon: <Icon icon={IconNames.Th} className={"node-icon"} size={IconSize.STANDARD} />,
						hasCaret: false,
					},
				);
			});

			return children;
		},
		[createNode, openShell],
	);

	const setDatabaseListToTree = useCallback(
		(databases: { system: DatabasesWithInformation; personal: DatabasesWithInformation }) => {
			const { system, personal } = databases;

			const createOverlayElements = (db) => [
				{ item: "Open shell", cb: () => openShell(db.name) },
				{
					item: "Create collection",
					cb: () => {
						setCreateCollectionDialogInfo({
							database: db.name,
							visible: true,
						});
					},
				},
				{
					intent: Intent.DANGER,
					item: "Drop database",
					cb: () => {
						setDropDatabaseDialogInfo({
							database: db.name,
							visible: true,
						});
					},
				},
			];

			const systemNodes = system.map((db) =>
				createNode(
					<div className="node">
						<ContextMenu items={createOverlayElements(db)}>
							<span>{db.name}</span>
						</ContextMenu>
					</div>,
					db.key,
					setCollectionListToTree(db.name, db.collections || []),
					{
						icon: <Icon icon={IconNames.Database} className="node-icon" />,
						hasCaret: !!(db.collections && db.collections.length > 0),
						isExpanded: expandedKeys && expandedKeys.includes(db.key),
					},
				),
			);

			addNodeAtEnd(
				<div className="node">
					<span>system</span>
				</div>,
				"folder;system",
				systemNodes,
				{
					icon: <Icon icon={IconNames.FolderOpen} className="node-icon" />,
					isExpanded: expandedKeys && expandedKeys.includes("folder;system"),
				},
			);

			for (const db of personal) {
				addNodeAtEnd(
					<div className="node">
						<ContextMenu items={createOverlayElements(db)}>
							<span>{db.name}</span>
						</ContextMenu>
					</div>,
					db.key,
					setCollectionListToTree(db.name, db.collections || []),
					{
						icon: <Icon icon={IconNames.Database} className="node-icon" />,
						hasCaret: !!(db.collections && db.collections.length > 0),
						isExpanded: expandedKeys && expandedKeys.includes(db.key),
					},
				);
			}
		},
		[setCollectionListToTree, addNodeAtEnd, createNode, openShell, expandedKeys],
	);

	const fetchAndCacheCollections = useCallback(
		(dbName: string) => {
			return storedConnectionId
				? window.ark.driver
						.run("database", "listCollections", {
							id: storedConnectionId,
							database: dbName,
						})
						.then((collections) => {
							if (collections && collections.length) {
								updateCachedConnectionDBListEntry(dbName, collections);
							}
						})
						.catch((err) => {
							handleErrors(err);
						})
				: Promise.resolve();
		},
		[storedConnectionId, updateCachedConnectionDBListEntry],
	);

	const fetchAndCacheDatabases = useCallback(
		(storedConnectionId: string) => {
			return Promise.all([
				window.ark.driver.run("connection", "listDatabases", {
					id: storedConnectionId,
				}),
				window.ark.driver.run("connection", "load", {
					id: storedConnectionId,
				}),
			]).then(([databases, storedConnection]) => {
				if (databases && databases.length && storedConnection) {
					updateCachedConnection(storedConnection, createDatabaseList(databases));
				}
			});
		},
		[updateCachedConnection],
	);

	const refresh = useCallback(() => {
		if (storedConnectionId) {
			setStoredConnectionId(undefined);
			fetchAndCacheDatabases(storedConnectionId).then(() => {
				setStoredConnectionId(storedConnectionId);
			});
		}
	}, [fetchAndCacheDatabases, storedConnectionId]);

	/* Load base tree */
	useEffect(() => {
		if (storedConnectionId && storedConnectionIdRef && storedConnectionIdRef.current !== storedConnectionId) {
			if (cachedConnections && cachedConnections[storedConnectionId]) {
				setDatabaseListToTree(cachedConnections[storedConnectionId].dbList);
			} else {
				fetchAndCacheDatabases(storedConnectionId);
			}
		}
		return () => {
			dropTree();
		};
	}, [fetchAndCacheDatabases, setDatabaseListToTree, cachedConnections, dropTree, storedConnectionId]);

	/** Register explorer event listeners */
	useEffect(
		() =>
			listenEffect([
				{
					event: "explorer:switch_connections",
					cb: (e, payload) => switchConnections(payload),
				},
			]),
		[switchConnections],
	);

	const explorerHeaderMenu = [
		{
			text: "Create database",
			key: "1",
			onClick: () => setCreateDatabaseDialogInfo({ visible: true }),
		},
		{
			key: "2",
			onClick: () => {},
			text: "Server Info",
		},
		{
			text: "Disconnect",
			intent: "danger",
			key: "3",
			onClick: () => {
				dispatch("connection_manager:disconnect", {
					connectionId: storedConnectionId,
				});
				dispatch("connection_manager:toggle");
				dispatch("explorer:hide");
			},
		},
	];

	return currentSidebarOpened === storedConnectionId ? (
		<Resizable
			enable={{
				right: true,
			}}
			maxWidth="50%"
			minWidth="25%"
			handleClasses={{
				right: "resize-handle vertical",
			}}
		>
			<div className="explorer">
				{storedConnectionId && cachedConnections[storedConnectionId] ? (
					<>
						<div className={"explorer-header"}>
							<div className={"explorer-header-title"}>
								{cachedConnections[storedConnectionId] && cachedConnections[storedConnectionId].connection.name}
							</div>
							<div className={"explorer-header-menu"}>
								<Button
									icon="refresh"
									size="small"
									variant="none"
									tooltipOptions={{
										content: "Refresh",
										position: "bottom",
									}}
									onClick={() => refresh()}
								/>
								<DropdownMenu items={explorerHeaderMenu}>
									<Button icon="more" size="small" variant="none" />
								</DropdownMenu>
							</div>
						</div>
						<Tree
							className={"explorer-tree"}
							onNodeExpand={(node) => {
								setExpandedKeys((keys) => [...keys, node.id as string]);
							}}
							onNodeCollapse={(node) => {
								setExpandedKeys((keys) => keys.filter((key) => key !== node.id));
							}}
							onNodeDoubleClick={(node) => {
								const key = node.id as string;
								const { type, value, ctx } = readKey(key);
								if (type === "database") {
									const db = value;
									if (node.childNodes && node.childNodes.length) {
										updateNodeProperties(key, { childNodes: [] });
									}
									setDatabaseNodeLoading(key, true);
									fetchAndCacheCollections(db).then(() => {
										setExpandedKeys((keys) => [...keys, key]);
										setDatabaseNodeLoading(key, false);
									});
								} else if (type === "collection") {
									const db = ctx;
									const collection = value;
									openShell(db, collection);
								}
							}}
							contents={tree}
						/>
					</>
				) : (
					<div className="explorer-loading">
						<CircularLoading />
					</div>
				)}
				{/* Dialogs */}
				<>
					{dropDatabaseDialogInfo.visible && (
						<DangerousActionPrompt
							confirmButtonText="Drop"
							title={"Dropping '" + dropDatabaseDialogInfo.database + "'"}
							prompt={"Are you sure you would like to drop the database '" + dropDatabaseDialogInfo.database + "'?"}
							onCancel={() => {
								setDropDatabaseDialogInfo({
									database: "",
									visible: false,
								});
							}}
							dangerousActionCallback={(err, result) => {
								if (err) {
									console.error(err);
									notify({
										title: "Database action",
										description: "An error occured while dropping the database",
										type: "error",
									});
								} else if (result) {
									if (result.ok) {
										notify({
											title: "Database action",
											description: "Successfully dropped database",
											type: "success",
										});
									} else if (!result.ok) {
										notify({
											title: "Database action",
											description: "Unable to drop the database",
											type: "error",
										});
									}
								}
								setDropDatabaseDialogInfo({
									database: "",
									visible: false,
								});
								refresh();
							}}
							dangerousAction={() => {
								if (storedConnectionId)
									return window.ark.driver.run("database", "dropDatabase", {
										id: storedConnectionId,
										database: dropDatabaseDialogInfo.database,
									});
								else return Promise.resolve({ ok: false });
							}}
						/>
					)}
					{dropCollectionDialogInfo.visible && (
						<DangerousActionPrompt
							confirmButtonText="Drop"
							title={"Dropping '" + dropCollectionDialogInfo.collection + "'"}
							prompt={
								"Are you sure you would like to drop the collection '" +
								dropCollectionDialogInfo.collection +
								"' from database '" +
								dropCollectionDialogInfo.database +
								"'?"
							}
							onCancel={() => {
								setDropCollectionDialogInfo({
									collection: "",
									database: "",
									visible: false,
								});
							}}
							dangerousActionCallback={(err, result) => {
								if (err) {
									console.error(err);
									notify({
										title: "Database action",
										description: "An error occured while dropping the collection",
										type: "error",
									});
								} else if (result) {
									if (result.ok) {
										notify({
											title: "Database action",
											description: "Successfully dropped collection",
											type: "success",
										});
									} else if (!result.ok) {
										notify({
											title: "Database action",
											description: "Unable to drop the collection",
											type: "error",
										});
									}
								}
								setDropCollectionDialogInfo({
									collection: "",
									database: "",
									visible: false,
								});
								refresh();
							}}
							dangerousAction={() => {
								if (storedConnectionId)
									return window.ark.driver.run("database", "dropCollection", {
										id: storedConnectionId,
										database: dropCollectionDialogInfo.database,
										collection: dropCollectionDialogInfo.collection,
									});
								else return Promise.resolve({ ok: false });
							}}
						/>
					)}
					{createDatabaseDialogInfo.visible && (
						<TextInputPrompt
							confirmButtonText="Create"
							title={"Creating database"}
							inputs={[
								{ label: "Database Name", key: "db_name" },
								{ label: "Collection Name", key: "col_name" },
							]}
							onCancel={() => {
								setCreateDatabaseDialogInfo({
									visible: false,
								});
							}}
							onConfirmCallback={(err) => {
								if (err) {
									notify({
										title: "Database action",
										description: "Error occured while creating database",
										type: "error",
									});
								} else {
									notify({
										title: "Database action",
										description: "Successfully created database",
										type: "success",
									});
								}
								setCreateDatabaseDialogInfo({ visible: false });
								refresh();
							}}
							onConfirm={(inputs) => {
								const dbName = inputs["db_name"];
								const colName = inputs["col_name"];
								if (storedConnectionId) {
									return window.ark.driver.run("database", "createDatabase", {
										id: storedConnectionId,
										database: dbName,
										collection: colName,
									});
								} else {
									return Promise.reject(new Error("Invalid connection"));
								}
							}}
						/>
					)}
					{createCollectionDialogInfo.visible && (
						<TextInputPrompt
							confirmButtonText="Create"
							title={"Creating collection"}
							inputs={[{ label: "Collection Name", key: "col_name" }]}
							onCancel={() => {
								setCreateCollectionDialogInfo({
									database: "",
									visible: false,
								});
							}}
							onConfirmCallback={(err) => {
								if (err) {
									notify({
										title: "Database action",
										description: "Error occured while creating collection",
										type: "error",
									});
								} else {
									notify({
										title: "Database action",
										description: "Successfully created collection",
										type: "success",
									});
								}
								setCreateCollectionDialogInfo({
									database: "",
									visible: false,
								});
								refresh();
							}}
							onConfirm={(inputs) => {
								const dbName = createCollectionDialogInfo.database;
								const colName = inputs["col_name"];
								if (storedConnectionId) {
									return window.ark.driver.run("database", "createDatabase", {
										id: storedConnectionId,
										database: dbName,
										collection: colName,
									});
								} else {
									return Promise.reject(new Error("Invalid connection"));
								}
							}}
						/>
					)}
				</>
			</div>
		</Resizable>
	) : (
		<></>
	);
};
