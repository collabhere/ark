import React, { FC, useContext } from "react";
import { SettingsContext } from "../../../../layout/BaseContextProvider";
import { formatBSONToText, replaceQuotes } from "../../../../../../util/misc";
import Monaco from "@monaco-editor/react";

export interface JSONViewerProps {
	text: Ark.BSONArray | string;
}

export const PlainTextViewer: FC<JSONViewerProps> = (props) => {
	const { text } = props;

	const { settings } = useContext(SettingsContext);

	return (
		<div className={"json-viewer"}>
			<Monaco
				beforeMount={(monaco) => {
					monaco.editor.defineTheme("ark", {
						base: "vs-dark",
						inherit: true,
						rules: [],
						colors: {
							"editor.background": "#111731",
							foreground: "#e2e6f8",
						},
					});
				}}
				options={{
					readOnly: true,
					scrollBeyondLastLine: false,
					lineNumbers: settings?.lineNumbers === "off" ? "off" : "on",
					minimap: {
						enabled: settings?.miniMap === "on" ? true : false,
					},
				}}
				theme={"ark"}
				height="100%"
				defaultValue={
					typeof text === "string"
						? text
						: replaceQuotes(formatBSONToText(text, settings?.timezone)) + "\n"
				}
				defaultLanguage="javascript"
			/>
		</div>
	);
};
