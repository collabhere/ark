import "./styles.less";
import React, { FC, useCallback, useContext } from "react";
import { dispatch } from "../../common/utils/events";
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
			dispatch("explorer:switch_connections", { connectionId });
			setCurrentSidebarOpened(connectionId);
		},
		[setCurrentSidebarOpened]
	);

	const calculateInitials = (name: string) => {
		const splitName = name.split(" ");
		return splitName.length > 1
			? `${splitName[0][0]}${splitName[1][0]}`.toUpperCase()
			: `${splitName[0]}${splitName[1]}`.toUpperCase();
	};

	return (
		<div className="sidebar">
			<div className="item home" onClick={listConnections}>
				<Button
					active={currentSidebarOpened === "manager"}
					variant="link"
					icon="database"
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
