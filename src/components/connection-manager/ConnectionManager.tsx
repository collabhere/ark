import "./styles.less";
import React, { FC, useCallback, useEffect, useState } from "react";
import { Card } from "antd";
import {
	VscDatabase,
	VscEdit,
	VscRepoClone,
	VscTrash,
	VscAdd,
	VscGlobe,
	VscDebugDisconnect,
} from "react-icons/vsc";
import { dispatch, listenEffect } from "../../util/events";
import { Resizable } from "re-resizable";
import { Button } from "../../common/components/Button";

interface ManagedConnection extends Ark.StoredConnection {
	active?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ConnectionManagerProps {}

export const ConnectionManager: FC<ConnectionManagerProps> = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [connections, setConnections] = useState<ManagedConnection[]>([]);
	const [listViewMode, setListViewMode] = useState<"detailed" | "compact">(
		"detailed"
	);

	const connect = useCallback((id: string) => {
		window.ark.driver.run("connection", "connect", { id }).then(() =>
			window.ark.driver.run("connection", "load", { id }).then((connection) => {
				const managed: ManagedConnection = { ...connection, active: true };
				setConnections((connections) => [
					...connections.filter((conn) => conn.id !== managed.id),
					managed,
				]);
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

				window.ark.driver
					.run("connection", "delete", { id: connection.id })
					.then(() => {
						setConnections((connections) => {
							const connectionIdx = connections.findIndex((c) => c.id === id);
							connections.splice(connectionIdx, 1);
							return [...connections];
						});
					});
			}
		},
		[connections, disconnect]
	);

	const openEditOrCloneConnection = useCallback(
		(connectionDetails: ManagedConnection, mode: "edit" | "clone") => {
			dispatch("browser:create_tab:connection_form", {
				connectionDetails,
				mode,
			});
		},
		[]
	);

	const openCreateConnection = useCallback(() => {
		dispatch("browser:create_tab:connection_form");
	}, []);

	/** On-load effect */
	useEffect(() => {
		window.ark.driver
			.run("connection", "list", undefined)
			.then((connections) => {
				setConnections(Object.values(connections));
			});
		return () => setConnections([]);
	}, []);

	useEffect(
		() =>
			listenEffect([
				{
					event: "connection_manager:hide",
					cb: () => {
						setIsOpen(false);
					},
				},
				{
					event: "connection_manager:toggle",
					cb: () => {
						setIsOpen((toggle) => !toggle);
					},
				},
				{
					event: "connection_manager:add_connection",
					cb: (e, payload) => {
						window.ark.driver
							.run("connection", "load", {
								id: payload.connectionId,
							})
							.then((connection) => {
								setConnections((connections) => [
									...connections.filter((conn) => conn.id !== connection.id),
									connection,
								]);
							});
					},
				},
			]),
		[]
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
			maxWidth="60%"
			minWidth="30%"
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
								shape="round"
								icon={<VscAdd />}
								size="middle"
								text="Create"
								variant="primary"
								onClick={() => openCreateConnection()}
							/>
						</div>
					</div>
				</div>
				<ConnectionsList
					listViewMode={listViewMode}
					connections={connections}
					onConnect={(conn) => connect(conn.id)}
					onDisconnect={(conn) => disconnect(conn.id)}
					onEdit={(conn) => openEditOrCloneConnection(conn, "edit")}
					onClone={(conn) => openEditOrCloneConnection(conn, "clone")}
					onDelete={(conn) => deleteConnection(conn.id)}
				/>
			</div>
		</Resizable>
	) : (
		<></>
	);
};

interface ConnectionsListProps extends ConnectionCardFunctions {
	connections: Ark.StoredConnection[];
	listViewMode: "detailed" | "compact";
}

export const ConnectionsList: FC<ConnectionsListProps> = (props) => {
	const {
		connections,
		listViewMode,
		onEdit,
		onDisconnect,
		onDelete,
		onConnect,
		onClone,
	} = props;
	return (
		<div className="Container">
			{connections && connections.length ? (
				connections.map((conn) => (
					<div key={conn.id} className="ConnectionDetails">
						{listViewMode === "detailed"
							? React.createElement(DetailedConnectionCard, {
									conn,
									onConnect: onConnect && (() => onConnect(conn)),
									onDisconnect: onDisconnect && (() => onDisconnect(conn)),
									onEdit: onEdit && (() => onEdit(conn)),
									onClone: onClone && (() => onClone(conn)),
									onDelete: onDelete && (() => onDelete(conn)),
							  })
							: React.createElement(CompactConnectionCard, {
									conn,
									onConnect: onConnect && (() => onConnect(conn)),
									onDisconnect: onDisconnect && (() => onDisconnect(conn)),
									onEdit: onEdit && (() => onEdit(conn)),
									onClone: onClone && (() => onClone(conn)),
									onDelete: onDelete && (() => onDelete(conn)),
							  })}
					</div>
				))
			) : (
				<></>
			)}
		</div>
	);
};

interface ConnectionCardFunctions {
	onConnect?: (conn: Ark.StoredConnection) => void;
	onDisconnect?: (conn: Ark.StoredConnection) => void;
	onEdit?: (conn: Ark.StoredConnection) => void;
	onClone?: (conn: Ark.StoredConnection) => void;
	onDelete?: (conn: Ark.StoredConnection) => void;
}
interface DetailedConnectionCardProps extends ConnectionCardFunctions {
	conn: ManagedConnection;
}

export const DetailedConnectionCard = (
	props: DetailedConnectionCardProps
): JSX.Element => {
	const { conn, onConnect, onDisconnect, onEdit, onClone, onDelete } = props;
	return (
		<Card
			title={CardTitle(
				conn.name,
				() => onConnect && onConnect(conn),
				() => onDisconnect && onDisconnect(conn),
				conn.active
			)}
		>
			<div className="FlexboxWithGap">
				<div className="CellInfo FlexFill TrimText">
					<div className="CellInfoTitle">Host</div>
					<div className="CellInfoTitleContent">{conn.hosts[0]}</div>
				</div>
				<div className="CellInfo FlexFill TrimText">
					<div className="CellInfoTitle">
						{conn.username && conn.database
							? "User/AuthDB"
							: conn.username
							? "User"
							: ""}
					</div>
					<div className="CellInfoTitleContent">
						{conn.username && conn.database
							? `${conn.username} / ${conn.database}`
							: conn.username
							? `${conn.username}`
							: ""}
					</div>
				</div>
			</div>
			<div className="FlexboxWithMargin">
				{onEdit && (
					<Button
						shape="round"
						icon={<VscEdit />}
						size="small"
						onClick={() => onEdit(conn)}
					/>
				)}

				{onClone && (
					<Button
						shape="round"
						icon={<VscRepoClone />}
						size="small"
						onClick={() => onClone(conn)}
					/>
				)}

				{onDelete && (
					<Button
						shape="round"
						icon={<VscTrash />}
						size="small"
						onClick={() => onDelete(conn)}
					/>
				)}
			</div>
		</Card>
	);
};

interface CompactConnectionCardProps {
	conn: ManagedConnection;
	onConnect?: () => void;
	onDisconnect?: () => void;
	onEdit?: () => void;
	onClone?: () => void;
	onDelete?: () => void;
}

export const CompactConnectionCard = (
	props: CompactConnectionCardProps
): JSX.Element => {
	const { conn, onClone, onConnect, onDelete, onDisconnect, onEdit } = props;
	return (
		<div className="CompactCard">
			<div className="CellInfo FlexFill TrimText">
				<div className="CellInfoTitle">Name</div>
				<div className="CellInfoTitleContent">{conn.name}</div>
			</div>
			<div className="CellInfo FlexFill TrimText">
				<div className="CellInfoTitle">Host</div>
				<div className="CellInfoTitleContent">{conn.hosts[0]}</div>
			</div>
			<div className="CellInfo FlexFill TrimText">
				<div className="CellInfoTitle">
					{conn.username && conn.database
						? "User/AuthDB"
						: conn.username
						? "User"
						: ""}
				</div>
				<div className="CellInfoTitleContent">
					{conn.username && conn.database
						? `${conn.username} / ${conn.database}`
						: conn.username
						? `${conn.username}`
						: ""}
				</div>
			</div>
			{!conn.active && onConnect && (
				<Button
					shape="round"
					icon={<VscGlobe />}
					size="small"
					onClick={onConnect}
				/>
			)}
			{conn.active && onDisconnect && (
				<Button
					shape="round"
					icon={<VscDebugDisconnect />}
					size="small"
					variant="danger"
					onClick={onDisconnect}
				/>
			)}
			{onEdit && (
				<Button
					shape="round"
					icon={<VscEdit />}
					size="small"
					onClick={onEdit}
				/>
			)}
			{onClone && (
				<Button
					shape="round"
					icon={<VscRepoClone />}
					size="small"
					onClick={onClone}
				/>
			)}
			{onDelete && (
				<Button
					shape="round"
					icon={<VscTrash />}
					size="small"
					onClick={onDelete}
				/>
			)}
		</div>
	);
};

const CardTitle = (
	title: string,
	inactiveClick: () => void,
	activeClick: () => void,
	active?: boolean
) => (
	<div className="CardTitle">
		<div className="CardTitleSection">
			<VscDatabase size="20" />
			<span className="FlexFill TrimText">{title}</span>
		</div>
		{!active && (
			<Button
				shape="round"
				icon={<VscGlobe />}
				size="small"
				text="Connect"
				// onClick={() => connect(id)}
				onClick={inactiveClick}
			/>
		)}

		{active && (
			<Button
				shape="round"
				icon={<VscDebugDisconnect />}
				size="small"
				variant="danger"
				text="Disconnect"
				// onClick={() => disconnect(id)}
				onClick={activeClick}
			/>
		)}
	</div>
);
