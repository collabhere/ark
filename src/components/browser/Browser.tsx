import "./browser.less";

import { Tabs } from "antd";
import { nanoid } from "nanoid";
import React, { useCallback, useEffect, useState } from "react";
import Shell from "../shell/Shell";
import { listenEffect } from "../../util/events";

const { TabPane } = Tabs;

type TabType = "shell" | "connection_form";
interface Tab {
	type: TabType;
	title: string;
	id: string;
	closable?: boolean;
}

const EmptyState = () => {
	return <div>This is an empty state!</div>;
};

export const Browser = (): JSX.Element => {
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeKey, setActiveKey] = useState<string>();

	/* onload useEffect */
	useEffect(() => {
		createShellTab();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const goToFirstTab = useCallback(() => {
		if (tabs && tabs.length) setActiveKey(tabs[0].id);
	}, [tabs]);

	const createShellTab = useCallback(() => {
		setTabs((tabs) => {
			const id = nanoid();
			const title = "Query - " + id;
			setActiveKey(() => id);
			return [...tabs, { type: "shell", title, id: "" + id, closable: true }];
		});
	}, []);

	const deleteTab = useCallback(
		(id) => {
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
	useEffect(() => {
		return listenEffect([
			{ event: "browser:create_tab", cb: createShellTab },
			{ event: "browser:delete_tab", cb: deleteTab },
		]);
	}, [createShellTab, deleteTab]);

	return (
		<div className="Browser">
			<Tabs
				hideAdd
				type="editable-card"
				activeKey={activeKey}
				className={"BrowserTabs"}
				defaultActiveKey="1"
				onEdit={(e, action) => {
					switch (action) {
						case "remove": {
							deleteTab(e);
							return;
						}
					}
				}}
				onChange={(activeKey) => setActiveKey(activeKey)}
			>
				{tabs && tabs.length ? (
					tabs.map((tab) => (
						<TabPane
							className={"BrowserTabPane"}
							closable={tab.closable}
							// closeIcon={}
							tab={tab.title}
							key={tab.id}
						>
							<Shell
								config={{
									db: "test_db_1",
									hosts: [
										"ec2-3-13-197-203.us-east-2.compute.amazonaws.com",
										"ec2-3-13-197-203.us-east-2.compute.amazonaws.com",
									],
									user: "dbuser",
									collection: "Users",
								}}
								collections={["test_collection_1"]}
							/>
						</TabPane>
					))
				) : (
					<EmptyState />
				)}
			</Tabs>
		</div>
	);
};
