import "./ContextMenu.less";

import { IconName, Intent, Menu, MenuDivider } from "@blueprintjs/core";
import { ContextMenu2, MenuItem2 } from "@blueprintjs/popover2";
import React, { FC, PropsWithChildren } from "react";

export interface CreateMenuItem {
	item?: string | React.ReactNode;
	key?: string;
	cb?: (key?: string) => void;
	icon?: IconName;
	intent?: Intent;
	divider?: boolean;
	disabled?: boolean;
	submenu?: CreateMenuItem[];
}
export const createContextMenuItems = (items: CreateMenuItem[]) => (
	<Menu>
		{items.map((menuItem, idx) =>
			menuItem.divider ? (
				<MenuDivider key={menuItem.key + "_idx_" + idx} />
			) : menuItem.submenu ? (
				<MenuItem2
					{...menuItem}
					key={menuItem.key + "_idx_" + idx}
					text={menuItem.item}
					onClick={() => menuItem.cb && menuItem.cb(menuItem.key)}
				>
					{createContextMenuItems(menuItem.submenu)}
				</MenuItem2>
			) : (
				<MenuItem2
					{...menuItem}
					key={menuItem.key + "_idx_" + idx}
					text={menuItem.item}
					onClick={() => menuItem.cb && menuItem.cb(menuItem.key)}
				/>
			),
		)}
	</Menu>
);

export const ContextMenu: FC<PropsWithChildren<{ items: CreateMenuItem[] }>> = (props) => {
	const { items, children } = props;
	return items.length ? (
		<ContextMenu2
			popoverProps={{
				popoverClassName: "context-menu",
			}}
			content={createContextMenuItems(items)}
		>
			{children}
		</ContextMenu2>
	) : (
		<>{children}</>
	);
};
