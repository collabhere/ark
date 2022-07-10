import "./styles.less";
import React, { FC, useCallback, useContext, useEffect, useState } from "react";
import { Icon, Card, IconSize } from "@blueprintjs/core";
import { dispatch, listenEffect } from "../../common/utils/events";
import { Resizable } from "re-resizable";
import { Button } from "../../common/components/Button";
import {
	ConnectionsContext,
	ManagedConnection,
	SettingsContext,
} from "../layout/BaseContextProvider";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ConnectionManagerProps {}

export const ConnectionController: FC<ConnectionManagerProps> = () => {
	const {
		connections,
		setConnections,
		load,
		connect,
		disconnect,
		deleteConnectionOnDisk,
	} = useContext(ConnectionsContext);
	const { currentSidebarOpened } = useContext(SettingsContext);

	const [listViewMode, setListViewMode] = useState<"detailed" | "compact">(
		"detailed"
	);
	const [listLoadError, setListLoadError] = useState<JSX.Element>();

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
		load().catch((err) => {
			setListLoadError(
				<div>
					<span>Something went wrong with loading the list.</span>
					<p>Error: {err.message}</p>
				</div>
			);
		});
	}, [load]);

	useEffect(
		() =>
			listenEffect([
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
				{
					event: "connection_manager:disconnect",
					cb: (e, payload) => {
						disconnect(payload.connectionId);
					},
				},
			]),
		[disconnect, setConnections]
	);

	return currentSidebarOpened === "manager" ? (
		<Resizable
			defaultSize={{
				width: "600px",
				height: "100%",
			}}
			enable={{
				right: true,
			}}
			maxWidth="50%"
			minWidth="30%"
		>
			<div className="connection-manager">
				<div className="container">
					<div className="header">
						<div className="title">Connections</div>
						<div className="buttons">
							<Button
								shape="round"
								icon="list"
								variant="primary"
								tooltipOptions={{
									content: "Switch view",
									position: "left-top",
								}}
								onClick={() =>
									setListViewMode((mode) =>
										mode === "compact" ? "detailed" : "compact"
									)
								}
							/>
							<Button
								shape="round"
								icon="add"
								text="Create"
								variant="primary"
								onClick={() => openCreateConnection()}
							/>
						</div>
					</div>
					<ConnectionsList
						listViewMode={listViewMode}
						connections={connections}
						error={listLoadError}
						onConnect={(conn) => connect(conn.id)}
						onDisconnect={(conn) => disconnect(conn.id)}
						onEdit={(conn) => openEditOrCloneConnection(conn, "edit")}
						onClone={(conn) => openEditOrCloneConnection(conn, "clone")}
						onDelete={(conn) => deleteConnectionOnDisk(conn.id)}
					/>
				</div>
			</div>
		</Resizable>
	) : (
		<></>
	);
};

interface ConnectionsListProps extends ConnectionCardFunctions {
	connections: Ark.StoredConnection[];
	listViewMode: "detailed" | "compact";
	error?: JSX.Element;
}

export const ConnectionsList: FC<ConnectionsListProps> = (props) => {
	const {
		connections,
		listViewMode,
		error,
		onEdit,
		onDisconnect,
		onDelete,
		onConnect,
		onClone,
	} = props;
	return (
		<div className="list">
			{!error ? (
				connections && connections.length ? (
					connections.map((conn) => (
						<div key={conn.id}>
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
				)
			) : (
				<p className="error">{error}</p>
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
		<Card className="card-detailed" interactive={false}>
			<DetailedCardTitle
				title={conn.name}
				inactiveClick={() => onConnect && onConnect(conn)}
				activeClick={() => onDisconnect && onDisconnect(conn)}
				active={conn.active}
			/>
			<div className="card-info">
				<div className="cell">
					<div className="cell-title">Host</div>

					{conn.hosts.length > 1 ? (
						<div className="cell-content">
							{conn.hosts.map(
								(host) =>
									// <div key={host}>{host}</div>
									host + "\n"
							)}
						</div>
					) : (
						<div className="cell-content">{conn.hosts[0]}</div>
					)}
				</div>
				<div className="cell">
					<div className="cell-title">
						{conn.username && conn.database
							? "User / AuthDB"
							: conn.username
							? "User"
							: ""}
					</div>
					<div className="cell-content">
						{conn.username && conn.database
							? `${conn.username} / ${conn.database}`
							: conn.username
							? `${conn.username}`
							: ""}
					</div>
				</div>
			</div>
			<div className="card-buttons">
				<Button
					shape="round"
					icon="clipboard"
					size="small"
					onClick={() => window.ark.copyText(conn.uri || "")}
					tooltipOptions={{
						content: "Copy URI",
						position: "bottom",
					}}
				/>
				{onEdit && (
					<Button
						shape="round"
						icon="edit"
						size="small"
						onClick={() => onEdit(conn)}
						tooltipOptions={{
							content: "Edit",
							position: "bottom",
						}}
					/>
				)}
				{onClone && (
					<Button
						shape="round"
						icon={"add-row-bottom"}
						size="small"
						onClick={() => onClone(conn)}
						tooltipOptions={{
							content: "Clone",
							position: "bottom",
						}}
					/>
				)}
				{onDelete && (
					<Button
						shape="round"
						icon="trash"
						size="small"
						onClick={() => onDelete(conn)}
						tooltipOptions={{
							content: "Delete",
							position: "bottom",
						}}
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
		<div className="card-compact">
			<div className="cell">
				<div className="cell-title">Name</div>
				<div className="cell-content">{conn.name}</div>
			</div>
			<div className="cell">
				<div className="cell-title">Host</div>
				<div className="cell-content">{conn.hosts[0]}</div>
			</div>
			<div className="cell">
				<div className="cell-title">{"User / AuthDB"}</div>
				<div className="cell-content">
					{`${conn.username || "-"} / ${conn.database || "-"}`}
				</div>
			</div>
			<div className="cell">
				<div className="cell-buttons">
					{!conn.active && onConnect && (
						<Button
							shape="round"
							icon="globe"
							size="small"
							onClick={onConnect}
						/>
					)}
					{conn.active && onDisconnect && (
						<Button
							shape="round"
							icon="th-disconnect"
							size="small"
							variant="danger"
							onClick={onDisconnect}
						/>
					)}
					{onEdit && (
						<Button shape="round" icon="edit" size="small" onClick={onEdit} />
					)}
					{onClone && (
						<Button
							shape="round"
							icon="add-row-bottom"
							size="small"
							onClick={onClone}
						/>
					)}
					{onDelete && (
						<Button
							shape="round"
							icon="trash"
							size="small"
							onClick={onDelete}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

interface CardTitleProps {
	title: string;
	inactiveClick: () => void;
	activeClick: () => void;
	active?: boolean;
}

const DetailedCardTitle: FC<CardTitleProps> = ({
	activeClick,
	inactiveClick,
	title,
	active,
}) => (
	<div className="card-title">
		<div className="title">
			<Icon size={IconSize.LARGE} icon="database" />
			<span>{title}</span>
		</div>
		{!active && (
			<Button
				shape="round"
				icon="globe"
				size="small"
				text="Connect"
				onClick={inactiveClick}
			/>
		)}

		{active && (
			<Button
				shape="round"
				icon="small-cross"
				size="small"
				variant="danger"
				text="Disconnect"
				onClick={activeClick}
			/>
		)}
	</div>
);
