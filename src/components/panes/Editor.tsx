import React, { FC, useState } from "react";
import "./panes.less";
import { Shell, ShellProps } from "../shell/Shell";
import { Resizable } from "re-resizable";
import AnsiToHtml from "ansi-to-html";
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

export type EditorProps = Pick<ShellProps, "shellConfig" | "contextDB">;

export const Editor: FC<EditorProps> = (props) => {
	const { shellConfig, contextDB } = props;

	const [currentResult, setCurrentResult] = useState<ResultViewerProps>();

	return (
		<div className={"Editor"}>
			<Resizable
				// minHeight={"20%"}
				maxHeight={"40%"}
				defaultSize={{ height: "20%", width: "100%" }}
				enable={{ bottom: true }}
			>
				<Shell
					shellConfig={shellConfig}
					contextDB={contextDB}
					collections={["test_collection_1"]}
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
				/>
			</Resizable>
			{currentResult && <ResultViewer {...currentResult} />}
		</div>
	);
};
