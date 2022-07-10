import React from "react";
import {
	IconName,
	MenuDivider,
	MenuItem,
	Menu,
	Intent,
} from "@blueprintjs/core";

export interface CreateMenuItem {
	item?: string;
	key?: string;
	cb?: (key?: string) => void;
	icon?: IconName;
	intent?: Intent;
	divider?: boolean;
	submenu?: CreateMenuItem[];
}
export const createContextMenuItems = (items: CreateMenuItem[]) => (
	<Menu>
		{items.map((menuItem, idx) =>
			menuItem.divider ? (
				<MenuDivider key={menuItem.key + "_idx_" + idx} />
			) : menuItem.submenu ? (
				<MenuItem
					intent={menuItem.intent}
					icon={menuItem.icon}
					key={menuItem.key + "_idx_" + idx}
					text={menuItem.item}
					onClick={() => menuItem.cb && menuItem.cb(menuItem.key)}
				>
					{createContextMenuItems(menuItem.submenu)}
				</MenuItem>
			) : (
				<MenuItem
					intent={menuItem.intent}
					icon={menuItem.icon}
					key={menuItem.key + "_idx_" + idx}
					text={menuItem.item}
					onClick={() => menuItem.cb && menuItem.cb(menuItem.key)}
				/>
			)
		)}
	</Menu>
);
