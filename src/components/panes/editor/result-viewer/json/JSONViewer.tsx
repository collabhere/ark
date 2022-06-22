import React, { FC, useContext } from "react";
import { SettingsContext } from "../../../../layout/BaseContextProvider";
import { formatBsonDocument, replaceQuotes } from "../../../../../../util/misc";

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
			{replaceQuotes(formatBSONToText(bson, settings?.timezone))}
		</div>
	);
};
