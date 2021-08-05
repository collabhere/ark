import "./connectionManager.less";
import React, { useCallback, useEffect, useState } from "react";
import { Button, Card } from "antd";
import {
	VscDatabase,
	VscEdit,
	VscRepoClone,
	VscTrash,
	VscAdd,
} from "react-icons/vsc";
import { dispatch } from "../../util/events";

export interface ConnectionDetails {
	connections: Array<{
		id: string;
		name: string;
		members: Array<string>;
		database: string;
		username: string;
		password: string;
		options: {
			authSource?: string;
			retryWrites?: "true" | "false";
			tls?: boolean;
			tlsCertificateFile?: string;
			w?: string;
		};
	}>;
}

export interface ConnectionManagerProps {
	connectionIds: Array<string>;
	setConnectionIds: React.Dispatch<React.SetStateAction<Array<string>>>;
}

export function ConnectionManager(): JSX.Element {
	const [activeConnectionIds, setActiveConnectionIds] = useState<Array<string>>(
		[]
	);

	const [connections, setConnections] = useState<
		ConnectionDetails["connections"]
	>([]);

	const connect = useCallback((id: string) => {
		window.ark.connection.create(id);
		setActiveConnectionIds((ids) => [...ids, id]);
		dispatch("explorer:add_connection", id);
	}, []);

	const disconnect = useCallback((id: string) => {
		window.ark.connection.disconnect(id);
		setActiveConnectionIds((ids) => ids.filter((i) => i !== id));
		dispatch("explorer:remove_connection", id);
	}, []);

	const deleteConnection = useCallback(
		(id: string) => {
			if (activeConnectionIds.includes(id)) {
				disconnect(id);
			}

			window.ark.connection.deleteConnection(id);
			setConnections((conns) => conns.filter((c) => c.id !== id));
		},
		[activeConnectionIds, disconnect]
	);

	useEffect(() => {
		window.ark.connection.getActiveConnectionIds().then((ids) => {
			setActiveConnectionIds(ids);
		});
	}, []);

	useEffect(() => {
		window.ark.connection.getAllConnections().then((connectionDetails) => {
			setConnections(Object.values(connectionDetails));
		});

		return () => setConnections([]);
	}, []);

	const CardTitle = (title: string, id: string) => (
		<div className={"CardTitle"}>
			<div style={{ display: "flex", flexGrow: 1, gap: "10px" }}>
				<VscDatabase size="20" />
				<div className={"NameContainer"}>{title}</div>
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

	return (
		<div className="Manager">
			{connections && (
				<div className="ConnectionsContainer">
					{connections.map((conn) => (
						<Card key={conn.name} title={CardTitle(conn.name, conn.id)}>
							<div style={{ display: "flex", gap: "20px" }}>
								<div style={{ flexGrow: 1 }}>{conn.members[0]}</div>
								<div style={{ flexGrow: 1 }}>
									<span>{conn.username}</span>
									<span> / {conn.database}</span>
								</div>
							</div>
							<div style={{ display: "flex", marginTop: "20px" }}>
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
					))}
				</div>
			)}
		</div>
	);
}
