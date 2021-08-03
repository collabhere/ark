import "./browser.less";

import { Tabs } from "antd";
import { nanoid } from "nanoid";
import React, { useCallback, useEffect, useState } from "react";
import type { FC, ComponentClass } from "react";
import { ShellProps } from "../shell/Shell";
import { listenEffect } from "../../util/events";
import { Editor, EditorProps } from "../panes/Editor";
import { ConnectionForm, ConnectionFormProps } from "../panes/ConnectionForm";

import SHELL_CONFIG_STUB from "../../json-stubs/shell-config.json";
import {
	ConnectionManagerProps,
	ConnectionManager,
} from "../connectionManager/ConnectionManager";

const { TabPane } = Tabs;

interface BaseTab {
	title: string;
	id: string;
	closable: boolean;
}
interface EditorTab extends BaseTab {
	type: "editor";
	shellConfig: ShellProps["shellConfig"];
}

interface ConnectionManagerTab extends BaseTab {
	type: "connection_manager";
}

interface ConnectionFormTab extends BaseTab {
	type: "connection_form";
	connectionDefaults: ConnectionFormProps["connectionDefaults"];
}

interface CreateEditorTabArgs {
	shellConfig: ShellProps["shellConfig"];
}

interface DeleteEditorTabArgs {
	id: string;
}

export type TabType = "editor" | "connection_form" | "connection_manager";
export type Tab = EditorTab | ConnectionFormTab | ConnectionManagerTab;
export type TabComponentProps =
	| EditorProps
	| ConnectionFormProps
	| ConnectionManagerProps;
export interface TabComponentMap {
	editor: EditorProps;
	connection_form: ConnectionFormProps;
	connection_manager: ConnectionManagerProps;
}

const TAB_PANES: {
	[k in TabType]?: FC<TabComponentMap[k]> | ComponentClass<TabComponentMap[k]>;
} = {
	// eslint-disable-next-line react/display-name
	editor: Editor,
	connection_form: ConnectionForm,
	connection_manager: ConnectionManager,
};

const EmptyState = () => {
	return <div>This is an empty state!</div>;
};

export const Browser = ({
	setConnectionIds,
}: {
	setConnectionIds: React.Dispatch<React.SetStateAction<Array<string>>>;
}): JSX.Element => {
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeKey, setActiveKey] = useState<string>();

	/* onload useEffect */
	useEffect(() => {
		createEditorTab({
			shellConfig: SHELL_CONFIG_STUB,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const goToFirstTab = useCallback(() => {
		if (tabs && tabs.length) setActiveKey(tabs[0].id);
	}, [tabs]);

	const createConnectionFormTab = useCallback(() => {
		setTabs((tabs) => {
			const id = "cf-" + nanoid();
			const title = "New connection";
			setActiveKey(() => id);
			return [
				...tabs,
				{
					type: "connection_form",
					closable: true,
					connectionDefaults: {
						tls: false,
					},
					id,
					title,
				},
			];
		});
	}, []);

	const createEditorTab = useCallback((args: CreateEditorTabArgs) => {
		const { shellConfig } = args;
		setTabs((tabs) => {
			const id = "e-" + nanoid();
			const title = "Query - " + id;
			setActiveKey(() => id);
			return [
				...tabs,
				{
					type: "editor",
					title,
					id: "" + id,
					closable: true,
					shellConfig,
				},
			];
		});
	}, []);

	const createConenctionManagerTab = useCallback(() => {
		setTabs((tabs) => {
			const id = "cm-" + nanoid();
			const title = "Connections";
			setActiveKey(() => id);
			return [
				...tabs,
				{
					type: "connection_manager",
					title,
					id: "" + id,
					closable: true,
					setConnectionIds,
				},
			];
		});
	}, [setConnectionIds]);

	const deleteTab = useCallback(
		(args: DeleteEditorTabArgs) => {
			const { id } = args;
			setTabs((tabs) => {
				const deleteIdx = tabs.findIndex((tab) => tab.id === id);
				tabs.splice(deleteIdx, 1);
				return [...tabs];
			});
			if (id !== activeKey) goToFirstTab();
		},
		[activeKey, goToFirstTab]
	);

	/** Register browser event listeners */
	useEffect(
		() =>
			listenEffect([
				{
					event: "browser:create_tab:editor",
					cb: (e, payload) => createEditorTab(payload),
				},
				{
					event: "browser:delete_tab:editor",
					cb: (e, payload) => deleteTab(payload),
				},
				{
					event: "browser:create_tab:connection_form",
					cb: () => createConnectionFormTab(),
				},
				{
					event: "browser:create_tab:connection_manager",
					cb: () => createConenctionManagerTab(),
				},
			]),
		[
			createEditorTab,
			deleteTab,
			createConnectionFormTab,
			createConenctionManagerTab,
		]
	);

	return (
		<div className="Browser">
			<Tabs
				hideAdd
				type="editable-card"
				activeKey={activeKey}
				className={"BrowserTabs"}
				defaultActiveKey="1"
				onEdit={(e, action) => {
					if (typeof e === "string")
						switch (action) {
							case "remove": {
								return deleteTab({ id: e });
							}
						}
				}}
				onChange={(activeKey) => setActiveKey(activeKey)}
			>
				{tabs && tabs.length ? (
					tabs.map((tab) => {
						const Component = TAB_PANES[tab.type];
						return (
							<TabPane
								className={"BrowserTabPane"}
								closable={tab.closable}
								// closeIcon={}
								tab={tab.title}
								key={tab.id}
							>
								{Component && React.createElement(Component as any, tab)}
							</TabPane>
						);
					})
				) : (
					<EmptyState />
				)}
			</Tabs>
		</div>
	);
};
