import "./explorer.less";

import React, { useCallback, useEffect, useState } from "react";
import { Tree, TreeDataNode } from "antd";
import { CloudServerOutlined } from "@ant-design/icons";
import { VscListTree } from "react-icons/vsc";
import { Resizable } from "re-resizable";
import { listenEffect } from "../../util/events";
import { ConnectionDetails } from "../connectionManager/ConnectionManager";

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

interface ExplorerProps {
	open: boolean;
}

export function Explorer(props: ExplorerProps): JSX.Element {
	const { open } = props;
	const [tree, setTree] = useState<TreeDataNode[]>([]);
	const [currentConnectionId, setCurrentConnectionId] = useState<string>();
	const [connections, setConnections] = useState<
		ConnectionDetails["connections"]
	>([]);

	const switchConnections = useCallback((args: SwitchConnectionsArgs) => {
		const { connectionId } = args;
		setCurrentConnectionId(connectionId);
	}, []);

	const addNewConnection = useCallback((id: string) => {
		window.ark.connection.getConnectionDetails(id).then((connection) => {
			setConnections((connections) => [...connections, connection]);
		});
	}, []);

	/* Load base tree */
	// useEffect(() => {}, []);

	/** Register explorer event listeners */
	useEffect(
		() =>
			listenEffect([
				{
					event: "explorer:switch_connections",
					cb: (e, payload) => switchConnections(payload),
				},
				{
					event: "explorer:add_connections",
					cb: (e, payload) => addNewConnection(payload),
				},
			]),
		[addNewConnection, switchConnections]
	);

	return open ? (
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
				<div>
					{connections?.map((conn) => (
						<div key={conn.id}>{conn.name}</div>
					))}
				</div>
				<Tree treeData={tree} />
			</div>
		</Resizable>
	) : (
		<></>
	);
}
