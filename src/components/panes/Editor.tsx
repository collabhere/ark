import React, { FC, useState, useEffect, useCallback, useMemo } from "react";
import { deserialize } from "bson";
import "./panes.less";
import { MONACO_COMMANDS, Shell } from "../shell/Shell";
import { Resizable } from "re-resizable";
import AnsiToHtml from "ansi-to-html";
import { Menu, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import {
	VscGlobe,
	VscDatabase,
	VscAccount,
	VscListTree,
} from "react-icons/vsc";
import { dispatch, listenEffect } from "../../util/events";
const ansiToHtmlConverter = new AnsiToHtml();

const createDefaultCodeSnippet = (collection: string) => `// Mongo shell
db.getCollection('${collection}').find({});
`;

export interface TreeViewerProps {
	json: Ark.AnyObject;
}

const TreeViewer: FC<TreeViewerProps> = (props) => {
	const { json } = props;
	return <div></div>;
};

export interface TextViewerProps {
	text: string | React.ReactNode;
}
const TextViewer: FC<TextViewerProps> = (props) => {
	const { text } = props;
	return typeof text == "string" ? (
		<div dangerouslySetInnerHTML={{ __html: text }}></div>
	) : (
		<div>{text}</div>
	);
};

interface JSONViewerProps {
	json: Ark.AnyObject;
}

const JSONViewer: FC<JSONViewerProps> = (props) => {
	const { json } = props;
	return (
		<>
			{Array.isArray(json) ? (
				json.map((doc, i) => (
					<div key={i}>
						<div>{"// " + (i + 1)}</div>
						<div>{JSON.stringify(doc, null, 4)}</div>
						<br />
					</div>
				))
			) : (
				<div>{JSON.stringify(json, null, 4)}</div>
			)}
		</>
	);
};

type ResultViewerProps =
	| { type: "json"; json: Ark.AnyObject }
	| { type: "text"; text: string | React.ReactNode }
	| { type: "tree"; tree: Ark.AnyObject };

export const ResultViewer: FC<ResultViewerProps> = (props) => {
	return (
		<div className="ResultViewerContainer">
			{props.type === "json" ? (
				<JSONViewer json={props[props.type]} />
			) : props.type === "text" ? (
				<TextViewer text={props[props.type]} />
			) : props.type === "tree" ? (
				<TreeViewer json={props[props.type]} />
			) : (
				<div>{"Incorrect view type!"}</div>
			)}
		</div>
	);
};

export interface EditorProps {
	shellConfig: Ark.ShellProps;
	contextDB: string;
	/** Browser tab id */
	id: string;
}

export const Editor: FC<EditorProps> = (props) => {
	const { shellConfig, contextDB, id: TAB_ID } = props;

	const { collection, username: user, members, uri } = shellConfig || {};

	const [currentResult, setCurrentResult] = useState<ResultViewerProps>();
	const [shellId, setShellId] = useState<string>();
	const code = useMemo(
		() =>
			collection
				? createDefaultCodeSnippet(collection)
				: createDefaultCodeSnippet("test"),
		[collection]
	);

	const exec = useCallback(
		(code) => {
			const _code = code.replace(/(\/\/.*)|(\n)/g, "");
			shellId &&
				window.ark.shell
					.eval(shellId, _code)
					.then(function ({ result, err }) {
						if (err) {
							console.log("exec shell");
							console.log(err);
							const message = err.message;
							const messageLines = message.split("\n").filter(Boolean);
							const [msg, code] = messageLines;
							const html = code ? ansiToHtmlConverter.toHtml(code) : "";
							// setTextResult(msg + "<br/>" + html);
							return;
						}
						const json = Object.values(
							deserialize(result ? result : Buffer.from([]))
						);
						setCurrentResult({
							type: "json",
							json,
						});
					})
					.catch(function (err) {
						console.error("exec shell error: ", err);
					});
		},
		[shellId]
	);

	useEffect(() => {
		contextDB &&
			window.ark.shell.create(uri, contextDB).then(function ({ id }) {
				setShellId(id);
			});
	}, [contextDB, uri]);

	/** Register browser event listeners */
	useEffect(
		() =>
			listenEffect([
				{
					event: "browser:delete_tab:editor",
					cb: (e, payload) => {
						if (payload.id === TAB_ID && shellId) {
							window.ark.shell.destroy(shellId);
						}
					},
				},
			]),
		[TAB_ID, shellId]
	);

	return (
		<div className={"Editor"}>
			<Resizable
				// minHeight={"20%"}
				maxHeight={"40%"}
				defaultSize={{ height: "20%", width: "100%" }}
				enable={{ bottom: true }}
			>
				<div className={"EditorHeader"}>
					<div className={"EditorHeaderItem"}>
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
					<div className={"EditorHeaderItem"}>
						<span>
							<VscDatabase />
						</span>
						<span>{contextDB}</span>
					</div>
					<div className={"EditorHeaderItem"}>
						<span>
							<VscAccount />
						</span>
						<span>{user}</span>
					</div>
					<div className={"EditorHeaderItem"}>
						<span>
							<VscListTree />
						</span>
						<span>{collection}</span>
					</div>
				</div>
				{shellId ? (
					<Shell
						initialCode={code}
						allCollections={["test_collection_1"]} // @todo: Fetch these collection names
						onMonacoCommand={(command, params) => {
							switch (command) {
								case MONACO_COMMANDS.CLONE_SHELL: {
									dispatch("browser:create_tab:editor", {
										shellConfig,
										contextDB,
									});
									return;
								}
								case MONACO_COMMANDS.EXEC_CODE: {
									const { code } = params;
									exec(code);
								}
							}
						}}
					/>
				) : (
					<div>Loading shell</div>
				)}
			</Resizable>
			{currentResult && <ResultViewer {...currentResult} />}
		</div>
	);
};

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
