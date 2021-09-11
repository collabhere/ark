import "./explorer.less";

import React, { FC, useCallback, useEffect, useState } from "react";
import { Tree, TreeDataNode } from "antd";
import { CloudServerOutlined } from "@ant-design/icons";
import { VscListTree } from "react-icons/vsc";
import { Resizable } from "re-resizable";
import { listenEffect } from "../../util/events";

const createTreeNode = (
	title: string,
	icon: React.ReactNode,
	...children: TreeDataNode[]
): TreeDataNode => {
	const node: TreeDataNode = {
		title,
		key: title,
		icon,
	};

	if (children) node.children = children;

	return node;
};

interface SwitchConnectionsArgs {
	connectionId: string;
}

interface Collection {
	name: string;
}
interface Database {
	name: string;
	collections: Collection[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ExplorerProps {}

export const Explorer: FC<ExplorerProps> = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [tree, setTree] = useState<TreeDataNode[]>([]);
	const [currentConnectionId, setCurrentConnectionId] = useState<string>();

	const switchConnections = useCallback((args: SwitchConnectionsArgs) => {
		const { connectionId } = args;
		setIsOpen(true);
		setCurrentConnectionId(connectionId);
	}, []);

	// useEffect(() => {
	// 	// Fetch this from driver using connectionId
	// 	console.log("connectionId in explorer", connectionId);
	// 	window.ark.connection.create(connectionId).then((conn: any) => {
	// 		console.log(`Conn obj for 2622 ${conn}`);
	// 		setConnection(conn);
	// 	});

	// 	// const databases: Database[] = [
	// 	// 	{
	// 	// 		name: "test_db_1",
	// 	// 		collections: [{ name: "Users" }, { name: "Logs" }],
	// 	// 	},
	// 	// ];
	// 	// const nodes: TreeDataNode[] = databases.reduce<TreeDataNode[]>(
	// 	// 	(nodes, database) => {
	// 	// 		nodes.push(
	// 	// 			createTreeNode(
	// 	// 				database.name,
	// 	// 				<CloudServerOutlined />,
	// 	// 				...database.collections.map((collection) =>
	// 	// 					createTreeNode(collection.name, <VscListTree />)
	// 	// 				)
	// 	// 			)
	// 	// 		);
	// 	// 		return nodes;
	// 	// 	},
	// 	// 	[]
	// 	// );
	// 	// setTree(nodes);
	// }, [connectionId]);

	/* Load base tree */
	useEffect(() => {
		if (currentConnectionId) {
			window.ark.collection
				.list(currentConnectionId)
				.then((collections: string[]) => {
					console.log(collections);
					if (collections && collections.length > 0) {
						const nodes: TreeDataNode[] = collections.map(
							(collection, index) => {
								return {
									key: index,
									title: collection,
									children: [
										{
											title: "Index",
											key: "random",
										},
									],
								};
							}
						);
						setTree(nodes);
					} else {
						console.log("[LIST_COLLECTIONS_ERRORED]");
					}
				});
		}
	}, [currentConnectionId]);

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
				<div className={"ExplorerHeader"}>Test Server [Company ABC]</div>
				<div>{currentConnectionId}</div>
				{tree && tree.length > 0 ? (
					<Tree treeData={tree} />
				) : (
					<p>No data to show</p>
				)}
			</div>
		</Resizable>
	) : (
		<></>
	);
};
