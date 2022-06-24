import React, { FC, useContext } from "react";
import { SettingsContext } from "../../../../layout/BaseContextProvider";
import { formatBsonDocument, replaceQuotes } from "../../../../../../util/misc";
import Monaco from "@monaco-editor/react";

export interface JSONViewerProps {
	bson: Ark.BSONArray;
}

export const JSONViewer: FC<JSONViewerProps> = (props) => {
	const { bson } = props;

	const { settings } = useContext(SettingsContext);

	const formatBSONToText = (doc: Ark.BSONArray, timezone = "local") =>
		Array.isArray(doc)
			? doc.map((elem) => formatBsonDocument(elem, timezone))
			: typeof doc === "object"
			? formatBsonDocument(doc, timezone)
			: doc;

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
					replaceQuotes(formatBSONToText(bson, settings?.timezone)) + "\n"
				}
				defaultLanguage="javascript"
			/>
		</div>
	);
};
