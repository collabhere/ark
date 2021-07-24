import "./browser.less";

import { Tabs } from "antd";
import { nanoid } from "nanoid";
import React, { useCallback, useEffect, useState } from "react";
import Shell from "../shell/Shell";

const { TabPane } = Tabs;

interface Tab {
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

	useEffect(() => {
		createTab();
		createTab();
	}, []);

	const goToFirstTab = useCallback(() => {
		if (tabs && tabs.length) setActiveKey(tabs[0].id);
	}, []);

	const createTab = useCallback(() => {
		setTabs((tabs) => {
			const id = nanoid();
			const title = "Query - " + id;
			return [...tabs, { title, id: "" + id, closable: true }];
		});
	}, []);

	const deleteTab = useCallback((id) => {
		setTabs((tabs) => {
			const deleteIdx = tabs.findIndex((tab) => tab.id === id);
			tabs.splice(deleteIdx, 1);
			return [...tabs];
		});
		if (id !== activeKey) goToFirstTab();
	}, []);

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
							<Shell collections={["test_collection_1"]} />
						</TabPane>
					))
				) : (
					<EmptyState />
				)}
			</Tabs>
		</div>
	);
};
