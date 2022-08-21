import { editor } from "monaco-editor";
import React, { FC, useContext } from "react";
import { formatBSONToText, replaceQuotes } from "../../../../../../util/misc";
import MONACO_THEME from "../../../../../common/styles/monaco-theme.json";
import { SettingsContext } from "../../../../layout/BaseContextProvider";
const Monaco = React.lazy(() => import("@monaco-editor/react"));

export interface JSONViewerProps {
	text: Ark.BSONArray | string;
}

export const PlainTextViewer: FC<JSONViewerProps> = (props) => {
	const { text } = props;

	const { settings } = useContext(SettingsContext);

	return (
		<div className={"json-viewer"}>
			<React.Suspense>
				<Monaco
					beforeMount={(monaco) => {
						monaco.editor.defineTheme("ark", MONACO_THEME as editor.IStandaloneThemeData);
					}}
					options={{
						readOnly: true,
						scrollBeyondLastLine: false,
						lineNumbers: settings?.lineNumbers ? "on" : "off",
						minimap: {
							enabled: !!settings?.miniMap,
						},
					}}
					theme={"ark"}
					height="100%"
					defaultValue={
						typeof text === "string" ? text : replaceQuotes(formatBSONToText(text, settings?.timezone)) + "\n"
					}
					defaultLanguage="javascript"
				/>
			</React.Suspense>
		</div>
	);
};
