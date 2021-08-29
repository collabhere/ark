import React, { FC, useState } from "react";
import "./panes.less";
import Shell, { ShellProps } from "../shell/Shell";
import { Resizable } from "re-resizable";
import AnsiToHtml from "ansi-to-html";
const ansiToHtmlConverter = new AnsiToHtml();

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
	return <pre>{JSON.stringify(json, null, 2)}</pre>;
};

type ResultViewerProps =
	| { type: "json"; json: Ark.AnyObject }
	| { type: "text"; text: string | React.ReactNode }
	| { type: "tree"; tree: Ark.AnyObject };

export const ResultViewer: FC<ResultViewerProps> = (props) => {
	return (
		<div className="ResultViewerContainer">
			{props.type === "json" ? (
				<JSONViewer json={props.json} />
			) : props.type === "text" ? (
				<TextViewer text={props.text} />
			) : (
				<></>
			)}
		</div>
	);
};

export interface EditorProps {
	shellConfig: ShellProps["shellConfig"];
}

export const Editor: FC<EditorProps> = (props) => {
	const { shellConfig } = props;

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
					collections={["test_collection_1"]}
					onExecutionResult={(result) => {
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
