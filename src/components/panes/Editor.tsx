import React, { FC, useState } from "react";
import "./panes.less";
import { MONACO_COMMANDS, Shell, ShellProps } from "../shell/Shell";
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
import { dispatch } from "../../util/events";
const ansiToHtmlConverter = new AnsiToHtml();

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
}

export const Editor: FC<EditorProps> = (props) => {
	const { shellConfig, contextDB } = props;

	const { collection, username: user, members } = shellConfig || {};

	const [currentResult, setCurrentResult] = useState<ResultViewerProps>();

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
				<Shell
					config={{
						collection,
						uri: shellConfig.uri,
					}}
					contextDB={contextDB}
					allCollections={["test_collection_1"]}
					onExecutionResult={(result) => {
						console.log("Execution result", result);
						setCurrentResult({
							type: "json",
							json: result.data,
						});
					}}
					onShellMessage={(message) => {
						console.log("Shell message");
						console.log(message);
						const messageLines = message.split("\n").filter(Boolean);
						const [msg, code] = messageLines;
						const html = code ? ansiToHtmlConverter.toHtml(code) : "";
						// setTextResult(msg + "<br/>" + html);
					}}
					onMonacoCommand={(command) => {
						switch (command) {
							case MONACO_COMMANDS.CLONE_SHELL: {
								dispatch("browser:create_tab:editor", {
									shellConfig,
									contextDB,
								});
								return;
							}
						}
					}}
				/>
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
