import "./browser.less";

import { Tabs } from "antd";
import { nanoid } from "nanoid";
import React, { useCallback, useEffect, useState } from "react";
import { listenEffect } from "../../util/events";
import { Editor, EditorProps } from "../panes/Editor";
import { ConnectionForm, ConnectionFormProps } from "../panes/ConnectionForm";

const { TabPane } = Tabs;

interface BaseTab {
	title: string;
	id: string;
	closable: boolean;
}

type EditorTab = { type: "editor" } & EditorProps & BaseTab;

type ConnectionFormTab = { type: "connection_form" } & ConnectionFormProps &
	BaseTab;

interface CreateEditorTabArgs {
	shellConfig: Ark.ShellProps;
	contextDB: string;
}

interface DeleteEditorTabArgs {
	id: string;
}

export type TabType = "editor" | "connection_form";
export type Tab = EditorTab | ConnectionFormTab;
export type TabComponentProps = EditorProps | ConnectionFormProps;
export interface TabComponentMap {
	editor: EditorProps;
	connection_form: ConnectionFormProps;
}

const TAB_PANES = {
	editor: Editor,
	connection_form: ConnectionForm,
} as const;

const EmptyState = () => {
	return <div>This is an empty state!</div>;
};

export const Browser = (): JSX.Element => {
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeKey, setActiveKey] = useState<string>();

	/* onload useEffect */
	useEffect(() => {}, []);

	const goToFirstTab = useCallback(() => {
		if (tabs && tabs.length) setActiveKey(tabs[0].id);
	}, [tabs]);

	const createConnectionFormTab = useCallback(
		(connectionParams?: {
			connectionDetails: Ark.StoredConnection;
			mode?: "edit" | "clone";
		}) => {
			const id = "cf-" + nanoid();
			setTabs((tabs) => {
				const title = "New connection";
				return [
					...tabs,
					{
						type: "connection_form",
						closable: true,
						connectionParams: connectionParams?.connectionDetails,
						mode: connectionParams?.mode,
						id,
						title,
					},
				];
			});
			setActiveKey(() => id);
		},
		[]
	);

	const createEditorTab = useCallback((args: CreateEditorTabArgs) => {
		const id = "e-" + nanoid();
		setTabs((tabs) => {
			const title = "Query - " + id;
			return [
				...tabs,
				{
					type: "editor",
					title,
					id: "" + id,
					closable: true,
					...args,
				},
			];
		});
		setActiveKey(() => id);
	}, []);

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
					cb: (e, payload) => createConnectionFormTab(payload),
				},
			]),
		[createEditorTab, deleteTab, createConnectionFormTab]
	);

	return (
		<div className="Browser">
			{tabs && tabs.length ? (
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
					{tabs.map((tab) => {
						const Component = React.createElement(
							TAB_PANES[tab.type] as any,
							tab
						);
						return (
							<TabPane
								className={"BrowserTabPane"}
								closable={tab.closable}
								// closeIcon={}
								tab={tab.title}
								key={tab.id}
							>
								{Component}
							</TabPane>
						);
					})}
				</Tabs>
			) : (
				<EmptyState />
			)}
		</div>
	);
};
