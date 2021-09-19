import "./shell.less";

import React, { FC, useCallback, useEffect, useState } from "react";
import {
	VscDatabase,
	VscGlobe,
	VscAccount,
	VscListTree,
} from "react-icons/vsc";
import { deserialize } from "bson";
import { Menu, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { default as Monaco } from "@monaco-editor/react";
import { KeyMod, KeyCode, editor } from "monaco-editor";
import { mountMonaco } from "./monaco";
import { dispatch } from "../../util/events";

const createDefaultCodeSnippet = (collection: string) => `// Mongo shell
db.getCollection('${collection}').find({});
`;
interface ExecutionResult {
	data: Ark.AnyObject;
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

export interface ShellProps {
	collections: string[];
	shellConfig: Ark.ShellProps;
	contextDB: string;
	onExecutionResult?: (result: ExecutionResult) => void;
	onShellMessage?: (message: string) => void;
}
export const Shell: FC<ShellProps> = (props) => {
	const {
		collections,
		onExecutionResult,
		shellConfig,
		contextDB,
		onShellMessage,
	} = props;

	const { collection, username: user, members } = shellConfig || {};

	const [code, setCode] = useState(() =>
		collection
			? createDefaultCodeSnippet(collection)
			: createDefaultCodeSnippet("test")
	);
	const [monacoEditor, setMonacoEditor] =
		useState<editor.IStandaloneCodeEditor>();
	const [shellId, setShellId] = useState<string>();

	const exec = useCallback(() => {
		const _code = code.replace(/(\/\/.*)|(\n)/g, "");
		shellId &&
			window.ark.shell
				.eval(shellId, _code)
				.then(function ({ result, err }) {
					if (err) {
						onShellMessage && onShellMessage(err.message);
						return console.error("exec shell error", err);
					}
					onExecutionResult &&
						onExecutionResult({
							data: Object.values(
								deserialize(result ? result : Buffer.from([]))
							),
						});
				})
				.catch(function (err) {
					console.error("exec shell error: ", err);
				});
	}, [code, onExecutionResult, onShellMessage, shellId]);

	const cloneCurrentTab = useCallback(() => {
		dispatch("browser:create_tab:editor", {
			shellConfig: shellConfig,
			contextDB,
		});
	}, [shellConfig, contextDB]);

	useEffect(() => {
		if (monacoEditor) {
			monacoEditor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, exec);
			monacoEditor.addCommand(
				KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_N,
				cloneCurrentTab
			);
		}
	}, [cloneCurrentTab, exec, monacoEditor]);

	useEffect(() => {
		contextDB &&
			window.ark.shell.create(shellConfig, contextDB).then(function ({ id }) {
				setShellId(id);
			});
	}, [shellConfig, contextDB]);

	return (
		<div className={"Shell"}>
			<div className={"ShellHeader"}>
				<div className={"ShellHeaderItem"}>
					<span>
						<VscGlobe />
					</span>
					{members.length === 1 ? (
						<span>{members[0]}</span>
					) : (
						<HostList
							hosts={members}
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
					<span>{contextDB}</span>
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
			<Monaco
				options={{
					minimap: {
						enabled: false,
					},
				}}
				theme={"ark"}
				beforeMount={(monaco) => {
					mountMonaco(monaco, { collections });
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
				onMount={(editor: editor.IStandaloneCodeEditor) => {
					setMonacoEditor(editor);
				}}
				onChange={(value, ev) => {
					value && setCode(value);
				}}
				height="100%"
				defaultValue={code}
				defaultLanguage="typescript"
			/>
		</div>
	);
};
