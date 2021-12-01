import "./styles.less";

import React, { FC, useCallback, useEffect, useState } from "react";
import { Tree } from "antd";
import { Resizable } from "re-resizable";
import { dispatch, listenEffect } from "../../common/utils/events";
import { CollectionInfo, ListDatabasesResult } from "mongodb";
import { useTree } from "../../hooks/useTree";
import { VscDatabase, VscFolder, VscListTree } from "react-icons/vsc";
import { CircularLoading } from "../../common/components/Loading";
import { handleErrors } from "../../common/utils/misc";

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

interface CollectionsMap {
	/* db_name => collection_name[] */
	[k: string]: string[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ExplorerProps {}

export const Explorer: FC<ExplorerProps> = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [storedConnection, setStoredConnection] =
		useState<Ark.StoredConnection>();
	const {
		tree,
		addChildrenToNode,
		updateNodeProperties,
		createNode,
		addNodeAtEnd,
		dropTree,
	} = useTree();
	const [currentConnectionId, setCurrentConnectionId] = useState<string>();
	const [collectionsMap, setCollectionsMap] = useState<CollectionsMap>({});
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

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
			});
		},
		[]
	);

	const addDatabaseNodes = useCallback(
		(databases: {
			system: DatabasesWithInformation;
			personal: DatabasesWithInformation;
		}) => {
			const { system, personal } = databases;
			addNodeAtEnd(
				"system",
				"system;",
				system.map((db) =>
					createNode(db.name, dbTreeKey(db.name), undefined, {
						icon: <VscDatabase />,
					})
				),
				{
					icon: <VscFolder />,
				}
			);
			personal.map((db) =>
				addNodeAtEnd(db.name, dbTreeKey(db.name), undefined, {
					icon: <VscDatabase />,
				})
			);
		},
		[addNodeAtEnd, createNode]
	);

	const addCollectionNodesToDatabase = useCallback(
		(db: string, collections: CollectionInfo[]) => {
			addChildrenToNode(
				dbTreeKey(db),
				collections.map((collection) =>
					createNode(
						collection.name,
						collectionTreeKey(collection.name, db),
						undefined,
						{
							icon: <VscListTree />,
						}
					)
				)
			);
		},
		[addChildrenToNode, createNode]
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
								setCollectionsMap((map) => {
									map[dbName] = collections.map((x) => x.name);
									return { ...map };
								});
							}
						})
						.catch((err) => {
							handleErrors(err);
						})
				: Promise.resolve();
		},
		[addCollectionNodesToDatabase, currentConnectionId]
	);

	const openShellForCollection = useCallback(
		(collection: string, db: string) => {
			currentConnectionId &&
				window.ark.driver
					.run("connection", "load", { id: currentConnectionId })
					.then((storedConnection) => {
						dispatch("browser:create_tab:editor", {
							shellConfig: { ...storedConnection, collection },
							contextDB: db,
							collections: collectionsMap[db] ? collectionsMap[db] : [],
							storedConnectionId: currentConnectionId,
						});
					});
		},
		[collectionsMap, currentConnectionId]
	);

	/* Load base tree */
	useEffect(() => {
		setLoading(true);
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
		return () => dropTree();
	}, [addDatabaseNodes, currentConnectionId, dropTree]);

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
		[switchConnections]
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
			{loading && storedConnection ? (
				<div className="Explorer">
					<div className={"ExplorerHeader"}>{storedConnection.name}</div>
					<Tree
						checkable={false}
						draggable={false}
						focusable={false}
						selectable={false}
						showIcon
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
							console.log("Double click node", node);
							const key = node.key as string;
							const [type, value, extra] = key.split(";");
							if (type === "database") {
								setDatabaseNodeLoading(key, true);
								addCollectionsToTree(value).then(() => {
									setDatabaseNodeLoading(key, false);
									setExpandedKeys((keys) => [...keys, key]);
								});
							} else if (type === "collection") {
								openShellForCollection(value, extra);
							}
						}}
						treeData={tree}
					/>
				</div>
			) : (
				<p>Loading</p>
			)}
		</Resizable>
	) : (
		<></>
	);
};
