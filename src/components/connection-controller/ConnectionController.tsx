import "./styles.less";
import React, { FC, useCallback, useContext, useEffect, useState } from "react";
import { Icon, Card, Elevation } from "@blueprintjs/core";
import { dispatch, listenEffect } from "../../common/utils/events";
import { Resizable } from "re-resizable";
import { Button } from "../../common/components/Button";
import {
	ConnectionsContext,
	ManagedConnection,
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

	const [isOpen, setIsOpen] = useState(false);
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
				{
					event: "connection_manager:copy_icon",
					cb: (e, payload) => {
						window.ark.driver.run("connection", "copyIcon", {
							name: payload.name,
							path: payload.path,
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

	return isOpen ? (
		<Resizable
			defaultSize={{
				width: "400px",
				height: "100%",
			}}
			enable={{
				right: true,
			}}
			maxWidth="50%"
			minWidth="20%"
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
								icon="add"
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
					error={listLoadError}
					onConnect={(conn) => connect(conn.id)}
					onDisconnect={(conn) => disconnect(conn.id)}
					onEdit={(conn) => openEditOrCloneConnection(conn, "edit")}
					onClone={(conn) => openEditOrCloneConnection(conn, "clone")}
					onDelete={(conn) => deleteConnectionOnDisk(conn.id)}
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
		<div className="Container">
			{!error ? (
				connections && connections.length ? (
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
				)
			) : (
				<p className="FlexAbsoluteCenter">{error}</p>
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
		<Card interactive={false}>
			<CardTitle
				title={conn.name}
				inactiveClick={() => onConnect && onConnect(conn)}
				activeClick={() => onDisconnect && onDisconnect(conn)}
				active={conn.active}
			/>
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
						icon="edit"
						size="small"
						onClick={() => onEdit(conn)}
					/>
				)}

				{onClone && (
					<Button
						shape="round"
						icon={"add-row-bottom"}
						size="small"
						onClick={() => onClone(conn)}
					/>
				)}

				{onDelete && (
					<Button
						shape="round"
						icon="trash"
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
				<Button shape="round" icon="globe" size="small" onClick={onConnect} />
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
				<Button shape="round" icon="trash" size="small" onClick={onDelete} />
			)}
		</div>
	);
};

interface CardTitleProps {
	title: string;
	inactiveClick: () => void;
	activeClick: () => void;
	active?: boolean;
}

const CardTitle: FC<CardTitleProps> = ({
	activeClick,
	inactiveClick,
	title,
	active,
}) => (
	<div className="CardTitle">
		<div className="CardTitleSection">
			<Icon icon="database" />
			<span className="FlexFill TrimText">{title}</span>
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
