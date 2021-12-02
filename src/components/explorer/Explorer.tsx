import "./styles.less";

import React, { FC, useCallback, useEffect, useState } from "react";
import { Dropdown, Menu, Tree } from "antd";
import { Resizable } from "re-resizable";
import { dispatch, listenEffect } from "../../common/utils/events";
import { CollectionInfo, ListDatabasesResult } from "mongodb";
import { useTree } from "../../hooks/useTree";
import {
	VscDatabase,
	VscFolder,
	VscListTree,
	VscKebabVertical,
	VscRefresh,
} from "react-icons/vsc";
import { CircularLoading } from "../../common/components/Loading";
import { handleErrors, notify } from "../../common/utils/misc";
import { Button } from "../../common/components/Button";
import { DangerousActionPrompt } from "../dialogs/DangerousActionPrompt";
import { TextInputPrompt } from "../dialogs/TextInputPrompt";
import { useRefresh } from "../../hooks/useRefresh";

type Databases = ListDatabasesResult["databases"];
type DatabasesWithInformation = (ListDatabasesResult["databases"][0] & {
	system: boolean;
})[];

const dbTreeKey = (dbName: string) => "database;" + dbName;
const collectionTreeKey = (collectionName: string, dbName: string) =>
	"collection;" + collectionName + ";" + dbName;

const PRE_EXISTING_DATABASE_RGX = /(admin|local|config)/i;

const createDatabaseList = (
	databases: Databases
): {
	system: DatabasesWithInformation;
	personal: DatabasesWithInformation;
} => {
	const personal: DatabasesWithInformation = [];
	const system: DatabasesWithInformation = [];
	for (const db of databases) {
		if (PRE_EXISTING_DATABASE_RGX.test(db.name)) {
			system.push({
				...db,
				system: true,
			});
		} else {
			personal.push({
				...db,
				system: false,
			});
		}
	}
	return {
		system,
		personal: personal.sort((a, b) => (a.name > b.name ? 1 : -1)),
	};
};

interface CreateMenuItem {
	item: string;
	cb: () => void;
	danger?: boolean;
}
const createContextMenu = (items: CreateMenuItem[]) => (
	<Menu>
		{items.map((menuItem, i) => (
			<Menu.Item danger={menuItem.danger} key={i} onClick={() => menuItem.cb()}>
				<a>{menuItem.item}</a>
			</Menu.Item>
		))}
	</Menu>
);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ExplorerProps {}

export const Explorer: FC<ExplorerProps> = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [storedConnection, setStoredConnection] =
		useState<Ark.StoredConnection>();
	const [currentConnectionId, setCurrentConnectionId] = useState<string>();
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

	const [refToken, refresh] = useRefresh();
	const {
		tree,
		addChildrenToNode,
		updateNodeProperties,
		createNode,
		addNodeAtEnd,
		dropTree,
	} = useTree();

	const switchConnections = useCallback((args: { connectionId: string }) => {
		const { connectionId } = args;
		setIsOpen(true);
		setCurrentConnectionId(connectionId);
		dispatch("connection_manager:hide");
	}, []);

	const setDatabaseNodeLoading = useCallback(
		(key: string, loading: boolean) => {
			updateNodeProperties(key, {
				icon: loading ? <CircularLoading size="small" /> : <VscDatabase />,
				disabled: loading,
			});
		},
		[updateNodeProperties]
	);

	const openShell = useCallback(
		(db: string, collection?: string) => {
			currentConnectionId &&
				Promise.all([
					window.ark.driver.run("connection", "load", {
						id: currentConnectionId,
					}),
					window.ark.driver.run("database", "listCollections", {
						id: currentConnectionId,
						database: db,
					}),
				]).then(([storedConnection, collections]) => {
					dispatch("browser:create_tab:editor", {
						shellConfig: { ...storedConnection, collection },
						contextDB: db,
						collections: collections.map((col) => col.name),
						storedConnectionId: currentConnectionId,
					});
				});
		},
		[currentConnectionId]
	);

	const addDatabaseNodes = useCallback(
		(databases: {
			system: DatabasesWithInformation;
			personal: DatabasesWithInformation;
		}) => {
			const { system, personal } = databases;

			const createOverlay = (db) =>
				createContextMenu([
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
					{ item: "Current operations", cb: () => {} },
					{ item: "Statistics", cb: () => {} },

					{
						danger: true,
						item: "Drop database",
						cb: () => {
							setDropDatabaseDialogInfo({
								database: db.name,
								visible: true,
							});
						},
					},
				]);

			addNodeAtEnd(
				"system",
				"folder;system",
				system.map((db) =>
					createNode(
						<Dropdown overlay={createOverlay(db)} trigger={["contextMenu"]}>
							<span>{db.name}</span>
						</Dropdown>,
						dbTreeKey(db.name),
						undefined,
						{
							icon: <VscDatabase />,
						}
					)
				),
				{
					icon: <VscFolder />,
				}
			);
			personal.map((db) =>
				addNodeAtEnd(
					<Dropdown overlay={createOverlay(db)} trigger={["contextMenu"]}>
						<span>{db.name}</span>
					</Dropdown>,
					dbTreeKey(db.name),
					undefined,
					{
						icon: <VscDatabase />,
					}
				)
			);
		},
		[addNodeAtEnd, createNode, openShell]
	);

	const addCollectionNodesToDatabase = useCallback(
		(db: string, collections: CollectionInfo[]) => {
			addChildrenToNode(
				dbTreeKey(db),
				collections.map((collection) =>
					createNode(
						<Dropdown
							overlay={createContextMenu([
								{
									item: "Open shell",
									cb: () => openShell(db, collection.name),
								},
								{ item: "Indexes", cb: () => {} },
								{
									danger: true,
									item: "Drop collection",
									cb: () => {
										setDropCollectionDialogInfo({
											database: db,
											collection: collection.name,
											visible: true,
										});
									},
								},
							])}
							trigger={["contextMenu"]}
						>
							<span>{collection.name}</span>
						</Dropdown>,
						collectionTreeKey(collection.name, db),
						undefined,
						{
							icon: <VscListTree />,
						}
					)
				)
			);
		},
		[addChildrenToNode, createNode, openShell]
	);

	const addCollectionsToTree = useCallback(
		(dbName: string) => {
			return currentConnectionId
				? window.ark.driver
						.run("database", "listCollections", {
							id: currentConnectionId,
							database: dbName,
						})
						.then((collections) => {
							if (collections && collections.length) {
								addCollectionNodesToDatabase(dbName, collections);
							}
						})
						.catch((err) => {
							handleErrors(err);
						})
				: Promise.resolve();
		},
		[addCollectionNodesToDatabase, currentConnectionId]
	);

	/* Load base tree */
	useEffect(() => {
		if (currentConnectionId) {
			Promise.all([
				window.ark.driver.run("connection", "listDatabases", {
					id: currentConnectionId,
				}),
				window.ark.driver.run("connection", "load", {
					id: currentConnectionId,
				}),
			])
				.then(([databases, storedConnection]) => {
					if (databases && databases.length) {
						addDatabaseNodes(createDatabaseList(databases));
					}
					if (storedConnection) {
						setStoredConnection(storedConnection);
					}
				})
				.catch((err) => {
					handleErrors(err);
				});
		}
		return () => {
			dropTree();
			setStoredConnection(undefined);
		};
	}, [addDatabaseNodes, currentConnectionId, dropTree, refToken]);

	/** Register explorer event listeners */
	useEffect(
		() =>
			listenEffect([
				{
					event: "explorer:hide",
					cb: () => setIsOpen(false),
				},
				{
					event: "explorer:switch_connections",
					cb: (e, payload) => switchConnections(payload),
				},
			]),
		[switchConnections, refToken]
	);

	return isOpen ? (
		<Resizable
			defaultSize={{
				width: "20%",
				height: "100%",
			}}
			enable={{
				right: true,
			}}
			maxWidth="40%"
			minWidth="20%"
			minHeight="100%"
		>
			<div className="Explorer">
				{storedConnection ? (
					<>
						<div className={"ExplorerHeader"}>
							<div className={"ExplorerHeaderTitle"}>
								{storedConnection.name}
							</div>
							<div className={"ExplorerHeaderMenu"}>
								<Button
									icon={<VscRefresh />}
									size="small"
									variant="primary"
									popoverOptions={{
										hover: {
											content: "Refresh",
										},
									}}
									onClick={() => refresh()}
								/>
								<Dropdown
									overlay={
										<Menu>
											<Menu.Item
												key={1}
												onClick={() =>
													setCreateDatabaseDialogInfo({ visible: true })
												}
											>
												<a>Create database</a>
											</Menu.Item>
											<Menu.Item key={2} onClick={() => {}}>
												<a>Server Info</a>
											</Menu.Item>
											<Menu.Item
												danger
												key={3}
												onClick={() => {
													dispatch("connection_manager:disconnect", {
														connectionId: currentConnectionId,
													});
													dispatch("connection_manager:toggle");
													dispatch("explorer:hide");
												}}
											>
												<a>Disconnect</a>
											</Menu.Item>
										</Menu>
									}
									trigger={["click"]}
								>
									<Button
										icon={<VscKebabVertical />}
										size="small"
										variant="primary"
									/>
								</Dropdown>
							</div>
						</div>
						<Tree
							checkable={false}
							draggable={false}
							focusable={false}
							selectable={false}
							showIcon
							defaultExpandedKeys={[]}
							expandedKeys={expandedKeys}
							className={"ExplorerTree"}
							onExpand={(keys, info) => {
								const { expanded, node } = info;
								if (expanded)
									setExpandedKeys((keys) => [...keys, node.key as string]);
								else
									setExpandedKeys((keys) =>
										keys.filter((key) => key !== node.key)
									);
							}}
							onDoubleClick={(e, node) => {
								const key = node.key as string;
								const [type, value, extra] = key.split(";");
								if (type === "database") {
									if (node.children && node.children.length) {
										updateNodeProperties(key, { children: [] });
									}
									setDatabaseNodeLoading(key, true);
									addCollectionsToTree(value).then(() => {
										setExpandedKeys((keys) => [...keys, key]);
										setDatabaseNodeLoading(key, false);
									});
								} else if (type === "collection") {
									openShell(extra, value);
								}
							}}
							treeData={tree}
						/>
					</>
				) : (
					<div className="ExplorerLoading">
						<CircularLoading />
					</div>
				)}
				{/* Dialogs */}
				<>
					{dropDatabaseDialogInfo.visible && (
						<DangerousActionPrompt
							confirmButtonText="Drop"
							title={"Dropping '" + dropDatabaseDialogInfo.database + "'"}
							prompt={
								"Are you sure you would like to drop the database '" +
								dropDatabaseDialogInfo.database +
								"'?"
							}
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
								if (currentConnectionId)
									return window.ark.driver.run("database", "dropDatabase", {
										id: currentConnectionId,
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
										description:
											"An error occured while dropping the collection",
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
								if (currentConnectionId)
									return window.ark.driver.run("database", "dropCollection", {
										id: currentConnectionId,
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
								if (currentConnectionId) {
									return window.ark.driver.run("database", "createDatabase", {
										id: currentConnectionId,
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
								if (currentConnectionId) {
									return window.ark.driver.run("database", "createDatabase", {
										id: currentConnectionId,
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
