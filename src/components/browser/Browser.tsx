import "./styles.less";

import { Tabs } from "antd";
import { nanoid } from "nanoid";
import React, { useCallback, useEffect, useState } from "react";
import { dispatch, listenEffect } from "../../util/events";
import { Editor, EditorProps } from "../panes/editor/Editor";
import {
	ConnectionForm,
	ConnectionFormProps,
} from "../panes/connection-form/ConnectionForm";
import { EmptyState } from "../onboarding/EmptyState";

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
	shellConfig: Ark.ShellConfig;
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

export const Browser = (): JSX.Element => {
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeKey, setActiveKey] = useState<string>();
	const [untitledCount, setUntitledCount] = useState(0);

	/* onload useEffect */
	useEffect(() => {}, []);

	const createConnectionFormTab = useCallback(
		(connectionParams?: {
			connectionDetails: Ark.StoredConnection;
			mode?: "edit" | "clone";
		}) => {
			const id = "cf-" + nanoid();
			setTabs((tabs) => {
				const title =
					connectionParams && connectionParams.mode
						? connectionParams.mode === "edit"
							? "Edit connection"
							: "Clone connection"
						: "New connection";
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

	const createEditorTab = useCallback(
		(args: CreateEditorTabArgs) => {
			const id = "e-" + nanoid();
			setTabs((tabs) => {
				const title = `Untitled-${
					untitledCount + 1
				} ${args.shellConfig.name.slice(0, 24)}...`;
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
			setUntitledCount((count) => (count += 1));
			setActiveKey(() => id);
		},
		[untitledCount]
	);

	const deleteTab = useCallback(
		(args: DeleteEditorTabArgs) => {
			const { id } = args;
			setTabs((tabs) => {
				const deleteIdx = tabs.findIndex((tab) => tab.id === id);
				const nextIdx = deleteIdx + 1;
				const prevIdx = deleteIdx - 1;
				if (id === activeKey && nextIdx <= tabs.length - 1)
					// Shift to next if possible
					setActiveKey(() => tabs[nextIdx].id);
				else if (id === activeKey && prevIdx >= 0)
					// else shift back
					setActiveKey(() => tabs[prevIdx].id);
				tabs.splice(deleteIdx, 1);
				return [...tabs];
			});
		},
		[activeKey]
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
				{
					event: "browser:delete_tab:connection_form",
					cb: (e, payload) => deleteTab(payload),
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
									if (e.startsWith("e-"))
										return dispatch("browser:delete_tab:editor", { id: e });
									else if (e.startsWith("cf-"))
										return dispatch("browser:delete_tab:connection_form", {
											id: e,
										});
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
