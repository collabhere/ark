import "./styles.less";
import { VscDatabase } from "react-icons/vsc";
import React, { FC, useCallback, useEffect, useState } from "react";
import { dispatch, listenEffect } from "../../common/utils/events";
import { UploadFile } from "antd/lib/upload/interface";

type SidebarItem = Pick<Ark.StoredConnection, "id" | "name"> & {
	icon: UploadFile<Blob>;
};

export const Sidebar: FC = () => {
	const [items, setItems] = useState<SidebarItem[]>([]);

	const listConnections = useCallback(() => {
		dispatch("connection_manager:toggle");
		dispatch("explorer:hide");
	}, []);

	const switchConnections = useCallback((connectionId: string) => {
		dispatch("explorer:switch_connections", { connectionId });
	}, []);

	const addItem = useCallback(
		(item: SidebarItem) => {
			setItems((items) => {
				if (items.some((i) => i.name === item.name)) {
					return items;
				} else {
					return [...items, item];
				}
			});
			switchConnections(item.id);
		},
		[switchConnections]
	);

	const removeItem = useCallback((id: string) => {
		setItems((items) => items.filter((conn) => conn.id !== id));
	}, []);

	useEffect(
		() =>
			listenEffect([
				{
					event: "sidebar:add_item",
					cb: (e, payload) => addItem(payload),
				},
				{
					event: "sidebar:remove_item",
					cb: (e, payload) => removeItem(payload),
				},
			]),
		[addItem, removeItem]
	);

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
			{items?.map((conn) => (
				<div
					className="SidebarItem SidebarConnection"
					key={conn.id}
					onClick={() => switchConnections(conn.id)}
				>
					{conn.icon && conn.icon.name ? (
						<img src={`ark://icons/${conn.icon.name}`} width={30} height={30} />
					) : (
						calculateInitials(conn.name)
					)}
				</div>
			))}
		</div>
	);
};
