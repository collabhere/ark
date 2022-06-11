import "./styles.less";
import { VscDatabase } from "react-icons/vsc";
import React, { FC, useCallback, useContext } from "react";
import { dispatch } from "../../common/utils/events";
import { ConnectionsContext } from "../layout/BaseContextProvider";

export const Sidebar: FC = () => {
	const { connections } = useContext(ConnectionsContext);

	const listConnections = useCallback(() => {
		dispatch("connection_manager:toggle");
		dispatch("explorer:hide");
	}, []);

	const switchConnections = useCallback((connectionId: string) => {
		dispatch("explorer:switch_connections", { connectionId });
	}, []);

	const calculateInitials = (name: string) => {
		const splitName = name.split(" ");
		return splitName.length > 1
			? `${splitName[0][0]}${splitName[1][0]}`.toUpperCase()
			: `${splitName[0]}${splitName[1]}`.toUpperCase();
	};

	return (
		<div className="Sidebar">
			<div className="SidebarItem SidebarHome" onClick={listConnections}>
				<VscDatabase size="30" />
			</div>
			{connections.map((conn) =>
				conn.active ? (
					<div
						className="SidebarItem SidebarConnection"
						key={conn.id}
						onClick={() => switchConnections(conn.id)}
					>
						{conn.iconFileName ? (
							<img
								src={`ark://icons/${conn.iconFileName}`}
								width={30}
								height={30}
							/>
						) : (
							calculateInitials(conn.name)
						)}
					</div>
				) : (
					<></>
				)
			)}
		</div>
	);
};
