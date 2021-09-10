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
import { MongoClientOptions } from "mongodb";

export interface ConnectionDetails {
	id: string;
	type: "directConnection" | "replicaSet";
	name: string;
	members: Array<string>;
	database: string;
	username: string;
	password: string;
	options: MongoClientOptions;
	ssh?: {
		host: string;
		port: string;
		username: string;
		method: "privateKey" | "password";
		privateKey: string;
		passphrase?: string;
		askEachTime: boolean;
	};
}
interface ManagedConnection extends Ark.StoredConnection {
	active?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ConnectionManagerProps {}

export const ConnectionManager: FC<ConnectionManagerProps> = () => {
	const [isOpen, setIsOpen] = useState(false);
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

	const openEditOrCloneConnection = useCallback(
		(connectionDetails: ManagedConnection, mode: "edit" | "clone") => {
			dispatch("browser:create_tab:connection_form", {
				...connectionDetails,
				mode,
			});
		},
		[]
	);

	const openCreateConnection = useCallback(() => {
		dispatch("browser:create_tab:connection_form");
	}, []);

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

	const CardTitle = (title: string, id: string, active?: boolean) => (
		<div className="CardTitle">
			<div className="CardTitleSection">
				<VscDatabase size="20" />
				<div className="FlexFill">{title}</div>
			</div>
			<div>
				{!active && (
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

				{active && (
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
				<div className="Container">
					<div className="FlexboxWithMargin">
						<div className="FlexFill">
							<span className="Header">Connection Manager</span>
						</div>
						<div>
							<Button
								type="ghost"
								shape="round"
								icon={<VscAdd />}
								size="large"
								onClick={() => openCreateConnection()}
							>
								Create
							</Button>
						</div>
					</div>
				</div>

				{connections && (
					<div className="Container">
						{connections.map((conn) => (
							<div key={conn.id} className="ConnectionDetails">
								<Card title={CardTitle(conn.name, conn.id, conn.active)}>
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
												onClick={() => openEditOrCloneConnection(conn, "edit")}
											/>
										</div>
										<div>
											<Button
												type="ghost"
												shape="circle"
												icon={<VscRepoClone />}
												size={"large"}
												onClick={() => openEditOrCloneConnection(conn, "clone")}
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
