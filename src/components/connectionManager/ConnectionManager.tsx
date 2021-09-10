import "./connectionManager.less";
import React, { FC, useCallback, useEffect, useState } from "react";
import { Button, Card } from "antd";
import {
	VscDatabase,
	VscEdit,
	VscRepoClone,
	VscTrash,
	VscAdd,
} from "react-icons/vsc";
import { dispatch, listenEffect } from "../../util/events";
import { Resizable } from "re-resizable";

interface ManagedConnection extends Ark.StoredConnection {
	active?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ConnectionManagerProps {}

export const ConnectionManager: FC<ConnectionManagerProps> = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [activeConnectionIds] = useState<string[]>([]);
	const [connections, setConnections] = useState<ManagedConnection[]>([]);

	const connect = useCallback((id: string) => {
		window.ark.driver.run("connection", "connect", { id }).then(() =>
			window.ark.driver
				.run("connection", "getConnectionDetails", { id })
				.then((connection) => {
					const managed: ManagedConnection = { ...connection, active: true };
					setConnections((connections) => [...connections, managed]);
					dispatch("sidebar:add_item", {
						id: connection.id,
						name: connection.name,
					});
				})
		);
	}, []);

	const disconnect = useCallback((id: string) => {
		window.ark.driver.run("connection", "disconnect", { id }).then(() => {
			setConnections((connections) => {
				const idx = connections.findIndex((c) => c.id === id);
				connections[idx].active = false;
				return [...connections];
			});
			dispatch("sidebar:remove_item", id);
		});
	}, []);

	const deleteConnection = useCallback(
		(id: string) => {
			const connection = connections.find((c) => c.id === id);
			if (connection) {
				if (connection.active) {
					disconnect(id);
				}

				window.ark.connection.deleteConnection(connection.id).then(() => {});
				setConnections((connections) => {
					const connectionIdx = connections.findIndex((c) => c.id === id);
					connections.splice(connectionIdx, 1);
					return [...connections];
				});
			}
		},
		[connections, disconnect]
	);

	useEffect(
		() =>
			listenEffect([
				{
					event: "connection_manager:toggle",
					cb: () => {
						dispatch("explorer:hide");
						setIsOpen((toggle) => !toggle);
					},
				},
			]),
		[]
	);

	useEffect(() => {
		window.ark.connection.getAllConnections().then((connectionDetails) => {
			setConnections(Object.values(connectionDetails));
		});

		return () => setConnections([]);
	}, []);

	const CardTitle = (title: string, id: string) => (
		<div className="CardTitle">
			<div className="CardTitleSection">
				<VscDatabase size="20" />
				<div className="FlexFill">{title}</div>
			</div>
			<div>
				{!activeConnectionIds.includes(id) && (
					<Button
						type="ghost"
						shape="round"
						icon={<VscAdd />}
						size="large"
						onClick={() => connect(id)}
					>
						Connect
					</Button>
				)}

				{activeConnectionIds.includes(id) && (
					<Button
						type="ghost"
						shape="round"
						icon={<VscAdd />}
						size="large"
						onClick={() => disconnect(id)}
					>
						Disconnect
					</Button>
				)}
			</div>
		</div>
	);

	return isOpen ? (
		<Resizable
			defaultSize={{
				width: "40%",
				height: "100%",
			}}
			enable={{
				right: true,
			}}
			maxWidth="40%"
			minWidth="20%"
			minHeight="100%"
		>
			<div className="ConnectionManager">
				{connections && (
					<div className="Container">
						{connections.map((conn) => (
							<div key={conn.id} className="ConnectionDetails">
								<Card title={CardTitle(conn.name, conn.id)}>
									<div className="FlexboxWithGap">
										<div className="FlexFill">{conn.members[0]}</div>
										<div className="FlexFill">
											<span>{conn.username}</span>
											<span> / {conn.database}</span>
										</div>
									</div>
									<div className="FlexboxWithMargin">
										<div>
											<Button
												type="ghost"
												shape="circle"
												icon={<VscEdit />}
												size={"large"}
											/>
										</div>
										<div>
											<Button
												type="ghost"
												shape="circle"
												icon={<VscRepoClone />}
												size={"large"}
											/>
										</div>
										<div>
											<Button
												type="ghost"
												shape="circle"
												icon={<VscTrash />}
												size={"large"}
												onClick={() => deleteConnection(conn.id)}
											/>
										</div>
									</div>
								</Card>
							</div>
						))}
					</div>
				)}
			</div>
		</Resizable>
	) : (
		<></>
	);
};
