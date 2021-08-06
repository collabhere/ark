import "./sidebar.less";
import { VscDatabase } from "react-icons/vsc";
import React, { useCallback, useEffect, useState } from "react";
import { dispatch, listenEffect } from "../../util/events";
import { ConnectionDetails } from "../connectionManager/ConnectionManager";

export const SideBar = (): JSX.Element => {
	const [connections, setConnections] = useState<Array<ConnectionDetails>>([]);

	const listConnections = useCallback(() => {
		dispatch("home:toggleView", "connectionManager");
	}, []);

	const toggleConnectionInExplorer = useCallback((connectionId: string) => {
		dispatch("home:toggleView", "explorer");
		dispatch("explorer:switch_connections", { connectionId });
	}, []);

	const addNewConnection = useCallback((id: string) => {
		window.ark.connection.getConnectionDetails(id).then((connection) => {
			setConnections((connections) => [...connections, connection]);
		});
	}, []);

	const removeConnection = useCallback((id: string) => {
		setConnections((connections) =>
			connections.filter((conn) => conn.id !== id)
		);
	}, []);

	useEffect(
		() =>
			listenEffect([
				{
					event: "sidebar:add_connection",
					cb: (e, payload) => addNewConnection(payload),
				},
				{
					event: "sidebar:remove_connection",
					cb: (e, payload) => removeConnection(payload),
				},
			]),
		[addNewConnection, removeConnection]
	);

	return (
		<div className="Sidebar">
			<div className="SidebarSection" onClick={listConnections}>
				<VscDatabase size="30" />
			</div>
			<div className="SidebarSection">
				{connections?.map((conn) => (
					<div
						key={conn.id}
						onClick={() => toggleConnectionInExplorer(conn.id)}
					>
						{conn.name[0]}
					</div>
				))}
			</div>
		</div>
	);
};
