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

export interface ConnectionManagerProps {
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

export function ConnectionManager({ setConns }: any): JSX.Element {
	const [connections, setConnections] = useState<
		ConnectionManagerProps["connections"]
	>([]);

	const connect = useCallback(
		(id: string) => {
			window.ark.connection.create(id);
			setConns((conns: any) => [...conns, id]);
		},
		[setConns]
	);

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
				<Button
					type="ghost"
					shape="round"
					icon={<VscAdd />}
					size="large"
					onClick={() => connect(id)}
				>
					Connect
				</Button>
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
