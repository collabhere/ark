import { IconName } from "@blueprintjs/core";
import { Reorder } from "framer-motion";
import * as React from "react";
import { Button } from "../../common/components/Button";

export interface TabItem {
	icon?: IconName;
	label: string;
}

interface Props {
	item: TabItem;
	id: number | string;
	isSelected: boolean;
	onClick: () => void;
	onRemove: () => void;
}

export const Tab = ({ id, item, onClick, onRemove, isSelected }: Props) => {
	return (
		<Reorder.Item
			as="div"
			className={"tab-item" + (isSelected ? " tab-active" : "")}
			value={id}
			id={String(id)}
			onMouseDown={(e) => {
				e.stopPropagation();
				onClick();
			}}
		>
			<div className="tab-title">{item.label}</div>
			<Button
				icon={"cross"}
				variant="link"
				size="small"
				onClick={(event) => {
					event.stopPropagation();
					onRemove();
				}}
			></Button>
		</Reorder.Item>
	);
};
