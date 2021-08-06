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
import { Resizable } from "re-resizable";

export interface ConnectionDetails {
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
}

export interface ConnectionManagerProps {
	open: boolean;
}

export function ConnectionManager(props: ConnectionManagerProps): JSX.Element {
	const { open } = props;
	const [activeConnectionIds, setActiveConnectionIds] = useState<Array<string>>(
		[]
	);

	const [connections, setConnections] = useState<Array<ConnectionDetails>>([]);

	const connect = useCallback((id: string) => {
		window.ark.connection.create(id);
		setActiveConnectionIds((ids) => [...ids, id]);
		dispatch("sidebar:add_connection", id);
	}, []);

	const disconnect = useCallback((id: string) => {
		window.ark.connection.disconnect(id);
		setActiveConnectionIds((ids) => ids.filter((i) => i !== id));
		dispatch("sidebar:remove_connection", id);
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

	return open ? (
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
}
