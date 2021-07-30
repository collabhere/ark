import React from "react";
import "./panes.less";
import Shell, { ShellProps } from "../shell/Shell";

export interface EditorProps {
	shellConfig: ShellProps["shellConfig"];
}

export function Editor(props: EditorProps): JSX.Element {
	const { shellConfig } = props;
	return (
		<div className={"Editor"}>
			<Shell shellConfig={shellConfig} collections={["test_collection_1"]} />
		</div>
	);
}
