import { Collapse, Icon, IconSize } from "@blueprintjs/core";
import { ContextMenu2 } from "@blueprintjs/popover2";
import React, { FC, PropsWithChildren, useState } from "react";
import { createContextMenuItems, CreateMenuItem } from "./ContextMenu";

export enum ContentRowActions {
	copy_json = "copy_json",
	copy_key = "copy_key",
	copy_value = "copy_value",
	edit_document = "edit_document",
	discard_edit = "discard_edit",
	delete_document = "delete_document",
}

export interface ContentRowProps {
	onContextMenuAction?: (action: ContentRowActions) => void;
	enableInlineEdits: boolean;
	allowModifyActions: boolean;
}

export const DocumentField: FC<PropsWithChildren<ContentRowProps>> = (
	props
) => {
	const {
		children,
		onContextMenuAction = () => {},
		enableInlineEdits,
		allowModifyActions,
	} = props;

	const items: CreateMenuItem[] = [
		{
			item: "Copy",
			key: "copy",
			intent: "primary",
			icon: "comparison",
			submenu: [
				{
					key: ContentRowActions.copy_key,
					item: "Key",
					cb: () => onContextMenuAction(ContentRowActions.copy_key),
				},
				{
					key: ContentRowActions.copy_value,
					item: "Value",
					cb: () => onContextMenuAction(ContentRowActions.copy_value),
				},
			],
		},
	];

	if (allowModifyActions) {
		items.push(
			{
				divider: true,
				key: "div_1",
			},
			{
				item: "Delete Document",
				key: ContentRowActions.delete_document,
				cb: () => onContextMenuAction(ContentRowActions.delete_document),
				icon: "trash",
				intent: "danger",
			}
		);

		items.splice(
			1,
			0,
			enableInlineEdits
				? {
						item: "Discard Edits",
						cb: () => onContextMenuAction(ContentRowActions.discard_edit),
						intent: "primary",
						icon: "cross",
						key: ContentRowActions.discard_edit,
				  }
				: {
						item: "Edit Document",
						cb: () => onContextMenuAction(ContentRowActions.edit_document),
						intent: "primary",
						icon: "edit",
						key: ContentRowActions.edit_document,
				  }
		);
	}

	return (
		<ContextMenu2
			className="context-menu"
			content={createContextMenuItems(items)}
		>
			<div className={"content-row"}>{children}</div>
		</ContextMenu2>
	);
};

export interface DocumentConfig {
	jsx: React.ReactNode;
	header: {
		menu?: JSX.Element;
		primary?: boolean;
		title: string;
		key: string | number;
		rightElement?: React.ReactNode;
	};
}

export interface DocumentTreeProps {
	tabIndex?: number;
	content: DocumentConfig[];
}

export const DocumentList: FC<DocumentTreeProps> = (props) => {
	const { tabIndex, content } = props;
	const [openKeys, setOpenKeys] = useState<Set<number>>(new Set());

	const toggleKey = (key: number) =>
		setOpenKeys(
			(keys) => (
				keys.has(key) ? keys.delete(key) : keys.add(key), new Set(keys)
			)
		);

	return (
		<div tabIndex={tabIndex} className="document-tree">
			{content.map(({ jsx, header }, key) => {
				return (
					<ContextMenu2
						key={header.key}
						disabled={!header.menu}
						content={header.menu}
					>
						<div
							className={"item" + (header.primary ? " primary" : "")}
							onClick={() => {
								toggleKey(key);
							}}
						>
							<div className="handle">
								<Icon
									size={IconSize.STANDARD}
									icon={
										("chevron-" + (openKeys.has(key) ? "down" : "right")) as
											| "chevron-right"
											| "chevron-down"
									}
								/>
							</div>
							<span className="heading">{header.title}</span>
							{header.rightElement && (
								<div className="top-right-element">{header.rightElement}</div>
							)}
						</div>
						<Collapse isOpen={openKeys.has(key)}>
							<div
								className="panel"
								onFocus={() => {
									if (!openKeys.has(key)) toggleKey(key);
								}}
							>
								{jsx}
							</div>
						</Collapse>
					</ContextMenu2>
				);
			})}
		</div>
	);
};
