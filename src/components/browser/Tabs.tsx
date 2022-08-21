import "./styles.less";
import React, { useEffect } from "react";
import { Reorder } from "framer-motion";
import { Tab } from "./Tab";
import { Editor, EditorProps } from "../panes/editor/Editor";
import {
	ConnectionForm,
	ConnectionFormProps,
} from "../panes/connection-form";

export interface BaseTab {
	title: string;
	id: string;
	closable: boolean;
}

export type EditorTab = { type: "editor" } & EditorProps & BaseTab;

export type ConnectionFormTab = {
	type: "connection_form";
} & ConnectionFormProps &
	BaseTab;

export type TabType = "editor" | "connection_form";
export type Tab = EditorTab | ConnectionFormTab;
export type TabComponentProps = EditorProps | ConnectionFormProps;

const TAB_PANES = {
	editor: Editor,
	connection_form: ConnectionForm,
} as const;

interface TabsProps {
	tabs: Tab[];
	selectedTab: Tab;
	onSelect(tab: Tab): void;
	onRemove(tab: Tab): void;
	onReorder(tabs: Tab[]): void;
}

export function Tabs(props: TabsProps) {
	const { tabs, onSelect, onRemove, onReorder, selectedTab } = props;

	useEffect(() => {
		const element = document.getElementById("TABS");

		const listener = (e: WheelEvent) => {
			e.preventDefault();
			if (element) {
				element.scrollLeft += e.deltaY;
				element.scrollLeft += e.deltaX;
			}
		};

		element?.addEventListener("wheel", listener);

		return () => element?.removeEventListener("wheel", listener);
	}, []);

	return (
		<div className="tabs-container">
			<Reorder.Group
				id="TABS"
				axis="x"
				as="div"
				onReorder={(idxs) => onReorder(idxs.map((idx) => tabs[idx]))}
				className="tabs-group"
				values={tabs.map((_, idx) => idx)}
				layoutScroll
			>
				{tabs.map((item, idx) => (
					<Tab
						key={item.id}
						id={idx}
						item={{
							label: item.title,
						}}
						isSelected={selectedTab.id === item.id}
						onClick={() => onSelect(item)}
						onRemove={() => onRemove(item)}
					/>
				))}
			</Reorder.Group>
			{tabs.map((tab) => {
				const Component = React.createElement(TAB_PANES[tab.type] as any, tab);
				return (
					<div
						key={tab.id}
						className="tab-pane"
						style={{ display: selectedTab.id === tab.id ? "block" : "none" }}
					>
						{Component}
					</div>
				);
			})}
		</div>
	);
}
