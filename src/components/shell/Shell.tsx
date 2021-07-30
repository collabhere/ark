import "./shell.less";

import React, { useCallback, useState } from "react";
import {
	VscDatabase,
	VscGlobe,
	VscAccount,
	VscListTree,
} from "react-icons/vsc";
import { Menu, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { default as Monaco } from "@monaco-editor/react";
import { KeyMod, KeyCode } from "monaco-editor";
import { registerCompletions } from "./completions";
import { Resizable } from "re-resizable";
import { dispatch } from "../../util/events";

const DEFAULT_CODE = `// Mongo shell
db.getCollection('test').find({});
`;
interface ExecutionResult {
	data: any[];
}

interface CreateMenuItem {
	item: string;
	cb: (item: string) => void;
}
const createMenu = (items: CreateMenuItem[]) => (
	<Menu>
		{items.map((menuItem, i) => (
			<Menu.Item key={i} onClick={() => menuItem.cb(menuItem.item)}>
				<a>{menuItem.item}</a>
			</Menu.Item>
		))}
	</Menu>
);

interface HostListProps {
	hosts: string[];
	onHostChange: (host: string) => void;
}
const HostList = (props: HostListProps) => {
	const { hosts, onHostChange } = props;

	return (
		<Dropdown
			overlay={createMenu(
				hosts.map((host) => ({ item: host, cb: onHostChange }))
			)}
			trigger={["click"]}
		>
			<a style={{ display: "flex" }} onClick={(e) => e.preventDefault()}>
				{hosts[0]}
				<DownOutlined />
			</a>
		</Dropdown>
	);
};

const SHELL_CONFIG_STUB = {
	db: "test_db_1",
	hosts: [
		"ec2-3-13-197-203.us-east-2.compute.amazonaws.com",
		"ec2-3-13-197-203.us-east-2.compute.amazonaws.com",
	],
	user: "dbuser",
	collection: "Users",
};

export interface ShellProps {
	collections: string[];
	shellConfig: {
		hosts: string[];
		db: string;
		user: string;
		collection?: string;
	};
	onExecutionResult?: (result: ExecutionResult) => void;
}
export default function Shell(props: ShellProps): JSX.Element {
	const {
		collections,
		onExecutionResult: onExecutionResult,
		shellConfig: config,
	} = props;

	const { db, collection, user, hosts } = config;

	const [code, setCode] = useState(DEFAULT_CODE);

	const exec = useCallback(() => {
		onExecutionResult &&
			onExecutionResult({
				data: [],
			});
	}, [onExecutionResult]);

	const cloneCurrentTab = useCallback(() => {
		dispatch("browser:create_tab:editor", {
			shellConfig: SHELL_CONFIG_STUB,
		});
	}, []);

	return (
		<div className={"Shell"}>
			<div className={"ShellHeader"}>
				<div className={"ShellHeaderItem"}>
					<span>
						<VscGlobe />
					</span>
					{hosts.length === 1 ? (
						<span>{hosts[0]}</span>
					) : (
						<HostList
							hosts={hosts}
							onHostChange={(host) => {
								console.log("Host change to:", host);
							}}
						/>
					)}
				</div>
				<div className={"ShellHeaderItem"}>
					<span>
						<VscDatabase />
					</span>
					<span>{db}</span>
				</div>
				<div className={"ShellHeaderItem"}>
					<span>
						<VscAccount />
					</span>
					<span>{user}</span>
				</div>
				<div className={"ShellHeaderItem"}>
					<span>
						<VscListTree />
					</span>
					<span>{collection}</span>
				</div>
			</div>
			<Resizable
				minHeight={"10%"}
				maxHeight={"40%"}
				defaultSize={{ height: "10%", width: "100%" }}
				enable={{ bottom: true }}
			>
				<Monaco
					options={{
						minimap: {
							enabled: false,
						},
					}}
					theme={"ark"}
					beforeMount={(monaco) => {
						registerCompletions(monaco, { collections });
						monaco.editor.defineTheme("ark", {
							base: "vs-dark",
							inherit: true,
							rules: [],
							colors: {
								"editor.foreground": "#000000",
								"editor.background": "#060a21",
								"editorCursor.foreground": "#8B0000",
								"editor.lineHighlightBackground": "#0000FF20",
								"editor.selectionBackground": "#8B0000",
								"editor.inactiveSelectionBackground": "#88000015",
							},
						});
					}}
					onMount={(editor, monaco) => {
						editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, exec);
						editor.addCommand(
							KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_N,
							cloneCurrentTab
						);
					}}
					onChange={(value, ev) => {
						value && setCode(value);
					}}
					height="100%"
					defaultValue={code}
					defaultLanguage="javascript"
				/>
			</Resizable>
		</div>
	);
}
