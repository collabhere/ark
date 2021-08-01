import "./sidebar.less";
import { VscDatabase } from "react-icons/vsc";
import React, { useCallback } from "react";
import { dispatch } from "../../util/events";

export const SideBar = (): JSX.Element => {
	const listConnections = useCallback(() => {
		dispatch("browser:create_tab:connection_manager");
	}, []);

	return (
		<div className="Sidebar">
			<div className="SidebarSection" onClick={listConnections}>
				<VscDatabase size="30" />
			</div>
		</div>
	);
};
