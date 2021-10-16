import "./styles.less";

import React, { FC, useCallback, useEffect, useState } from "react";
import { Tree } from "antd";
import { Resizable } from "re-resizable";
import { dispatch, listenEffect } from "../../util/events";
import { CollectionInfo, ListDatabasesResult } from "mongodb";
import { useTree } from "../../hooks/useTree";

const dbTreeKey = (dbName: string) => "database;" + dbName;
const collectionTreeKey = (collectionName: string, dbName: string) =>
	"collection;" + collectionName + ";" + dbName;

interface CollectionsMap {
	/* db_name => collection_name[] */
	[k: string]: string[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ExplorerProps {}

export const Explorer: FC<ExplorerProps> = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const { tree, addChildrenToNode, createNode, addNodeAtEnd, dropTree } =
		useTree();
	const [currentConnectionId, setCurrentConnectionId] = useState<string>();
	const [collectionsMap, setCollectionsMap] = useState<CollectionsMap>({});

	const switchConnections = useCallback((args: { connectionId: string }) => {
		const { connectionId } = args;
		setIsOpen(true);
		setCurrentConnectionId(connectionId);
		dispatch("connection_manager:hide");
	}, []);

	const addDatabaseNodes = useCallback(
		(databases: ListDatabasesResult) => {
			databases.map((db) => addNodeAtEnd(db.name, dbTreeKey(db.name)));
		},
		[addNodeAtEnd]
	);

	const addCollectionNodesToDatabase = useCallback(
		(db: string, collections: CollectionInfo[]) => {
			addChildrenToNode(
				dbTreeKey(db),
				collections.map((collection) =>
					createNode(collection.name, collectionTreeKey(collection.name, db))
				)
			);
		},
		[addChildrenToNode, createNode]
	);

	const addCollectionsToTree = useCallback(
		(dbName: string) => {
			currentConnectionId &&
				window.ark.driver
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
					});
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
							driverConnectionId: currentConnectionId,
						});
					});
		},
		[collectionsMap, currentConnectionId]
	);

	/* Load base tree */
	useEffect(() => {
		setLoading(true);
		if (currentConnectionId) {
			window.ark.driver
				.run("connection", "listDatabases", {
					id: currentConnectionId,
				})
				.then((databases) => {
					if (databases && databases.length) {
						addDatabaseNodes(databases);
					}
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
			<div className="Explorer">
				<div className={"ExplorerHeader"}>{currentConnectionId}</div>
				{loading ? (
					<Tree
						checkable={false}
						draggable={false}
						focusable={false}
						selectable={false}
						className={"ExplorerTree"}
						onDoubleClick={(e, node) => {
							console.log("Double click node", node);
							const key = node.key as string;
							const [type, value, extra] = key.split(";");
							if (type === "database") {
								addCollectionsToTree(value);
							} else if (type === "collection") {
								openShellForCollection(value, extra);
							}
						}}
						treeData={tree}
					/>
				) : (
					<p>Loading</p>
				)}
			</div>
		</Resizable>
	) : (
		<></>
	);
};
