import "./styles.less";
import React, { FC, useCallback, useContext, useEffect } from "react";
import { dispatch, listenEffect } from "../../common/utils/events";
import {
	ConnectionsContext,
	SettingsContext,
} from "../layout/BaseContextProvider";
import { Button } from "../../common/components/Button";

export const Sidebar: FC = () => {
	const { currentSidebarOpened, setCurrentSidebarOpened } =
		useContext(SettingsContext);
	const { connections } = useContext(ConnectionsContext);

	const listConnections = useCallback(() => {
		if (currentSidebarOpened !== "manager")
			return setCurrentSidebarOpened("manager");
		return setCurrentSidebarOpened("none");
	}, [currentSidebarOpened, setCurrentSidebarOpened]);

	const switchConnections = useCallback(
		(connectionId: string) => {
			if (
				currentSidebarOpened !== "manager"
				&& currentSidebarOpened !== "none"
			) {
				setCurrentSidebarOpened("none");
			}
			
			if (currentSidebarOpened !== connectionId) {
				dispatch("explorer:switch_connections", { connectionId });
				setCurrentSidebarOpened(connectionId);
			}
		},
		[currentSidebarOpened, setCurrentSidebarOpened]
	);

	const calculateInitials = (name: string) => {
		const splitName = name.split(" ");
		return splitName.length > 1
			? `${splitName[0][0]}${splitName[1][0]}`.toUpperCase()
			: `${splitName[0][0]}${splitName[0][1]}`.toUpperCase();
	};

	useEffect(
		() =>
			listenEffect([
				{
					event: "OPEN_CONNECTION_CONTROLLER",
					cb: () => listConnections(),
				},
			]),
		[listConnections]
	);

	return (
		<div className="sidebar">
			<div key="manager" className="item home" onClick={listConnections}>
				<Button
					active={currentSidebarOpened === "manager"}
					variant="link"
					icon="data-connection"
					size="large"
					tooltipOptions={{
						content: "Manage Connections",
					}}
				/>
			</div>
			{connections.map((conn) =>
				conn.active ? (
					<div
						className="item"
						key={conn.id}
						onClick={() => switchConnections(conn.id)}
					>
						{conn.iconFileName ? (
							<Button
								active={currentSidebarOpened === conn.id}
								text={
									<div className="icon">
										<img
											src={`ark://icons/${conn.iconFileName}`}
											width={25}
											height={25}
										/>
									</div>
								}
								tooltipOptions={{
									content: conn.name,
								}}
								variant="link"
								size="small"
							/>
						) : (
							<Button
								active={currentSidebarOpened === conn.id}
								text={
									<div className="initials">{calculateInitials(conn.name)}</div>
								}
								tooltipOptions={{
									content: conn.name,
								}}
								variant="link"
								size="small"
							/>
						)}
					</div>
				) : (
					<></>
				)
			)}
		</div>
	);
};
