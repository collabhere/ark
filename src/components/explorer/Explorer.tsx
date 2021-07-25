import "./explorer.less";

import React, { useEffect, useState } from "react";
import { Tree, TreeDataNode } from "antd";
import {
	CarryOutOutlined,
	FormOutlined,
	CloudServerOutlined,
} from "@ant-design/icons";

// const treeData = [
// 	{
// 		title: "parent 1",
// 		key: "0-0",
// 		icon: <CarryOutOutlined />,
// 		children: [
// 			{
// 				title: "parent 1-0",
// 				key: "0-0-0",
// 				icon: <CarryOutOutlined />,
// 				children: [
// 					{ title: "leaf", key: "0-0-0-0", icon: <CarryOutOutlined /> },
// 					{
// 						title: (
// 							<>
// 								<div>multiple line title</div>
// 								<div>multiple line title</div>
// 							</>
// 						),
// 						key: "0-0-0-1",
// 						icon: <CarryOutOutlined />,
// 					},
// 					{ title: "leaf", key: "0-0-0-2", icon: <CarryOutOutlined /> },
// 				],
// 			},
// 			{
// 				title: "parent 1-2",
// 				key: "0-0-2",
// 				icon: <CarryOutOutlined />,
// 				children: [
// 					{ title: "leaf", key: "0-0-2-0", icon: <CarryOutOutlined /> },
// 					{
// 						title: "leaf",
// 						key: "0-0-2-1",
// 						icon: <CarryOutOutlined />,
// 						switcherIcon: <FormOutlined />,
// 					},
// 				],
// 			},
// 		],
// 	},
// 	{
// 		title: "parent 2",
// 		key: "0-1",
// 		icon: <CarryOutOutlined />,
// 		children: [
// 			{
// 				title: "parent 2-0",
// 				key: "0-1-0",
// 				icon: <CarryOutOutlined />,
// 				children: [
// 					{ title: "leaf", key: "0-1-0-0", icon: <CarryOutOutlined /> },
// 					{ title: "leaf", key: "0-1-0-1", icon: <CarryOutOutlined /> },
// 				],
// 			},
// 		],
// 	},
// ];

// const createTreeNode = (
// 	collection: string,
// 	children?: TreeDataNode[]
// ): TreeDataNode => {
// 	const node: TreeDataNode = {
// 		title: collection,
// 		key: collection,
// 		icon: <CloudServerOutlined />,
// 	};

// 	if (children) node.children = children;

// 	return node;
// };

interface ExplorerProps {
	connectionId: string;
}

interface Collection {
	name: string;
}
interface Database {
	name: string;
	collections: Collection[];
}
interface Connection {
	id: string;
	databases: Database[];
}

export function Explorer(props: ExplorerProps): JSX.Element {
	const { connectionId } = props;
	const [tree, setTree] = useState<TreeDataNode[]>([]);
	const [connection, setConnection] = useState<Connection>();

	useEffect(() => {}, [connectionId]);

	useEffect(() => {}, [connection]);

	return (
		<div className="Explorer">
			<Tree defaultExpandedKeys={["0-0-0"]} treeData={tree} />
		</div>
	);
}
