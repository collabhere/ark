import React, { FC, PropsWithChildren } from "react";
import {
	MenuItem2,
	MenuItem2Props,
	Popover2,
	Popover2Props,
} from "@blueprintjs/popover2";
import { Menu, MenuDivider, MenuDividerProps } from "@blueprintjs/core";

import "./DropdownMenu.less";

interface Item extends MenuItem2Props {
	key: string;
	submenu?: DropdownMenuItems;
	divider?: boolean;
}

interface Divider extends MenuDividerProps {
	key: string;
	submenu?: DropdownMenuItems;
	divider?: boolean;
}

export type DropdownMenuItem = Item | Divider;

export type DropdownMenuItems = DropdownMenuItem[];

function isDivider(item: DropdownMenuItem): item is Divider {
	return item.divider === true;
}

const createSubMenu = (items: DropdownMenuItem[]) =>
	items.map((item) =>
		isDivider(item) ? (
			<MenuDivider {...item} />
		) : item.submenu ? (
			<MenuItem2 {...item}>{createSubMenu(item.submenu)}</MenuItem2>
		) : (
			<MenuItem2 {...item} />
		)
	);

export const createDropdownMenu = (items: DropdownMenuItems) => {
	return <Menu className="dropdown-menu">{createSubMenu(items)}</Menu>;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DropdownMenuProps extends Popover2Props {
	items: DropdownMenuItems;
}

export const DropdownMenu: FC<PropsWithChildren<DropdownMenuProps>> = (
	props
) => {
	const { children, items } = props;

	return (
		<Popover2
			{...props}
			interactionKind="click"
			minimal
			content={createDropdownMenu(items)}
		>
			{children}
		</Popover2>
	);
};
