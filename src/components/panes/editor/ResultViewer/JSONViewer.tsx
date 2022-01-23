import { ObjectId } from "bson";
import React, { FC } from "react";

export interface JSONViewerProps {
	bson: Ark.AnyObject | string;
}

export const JSONViewer: FC<JSONViewerProps> = (props) => {
	const { bson } = props;
	const isPrimitive = (val: unknown) =>
		!val || (typeof val !== "object" && !(val instanceof Date));

	const formatBson = (elem: Ark.AllElements) => {
		if (isPrimitive(elem)) {
			return elem;
		} else if (elem instanceof Date) {
			return `ISODate('` + elem.toISOString() + `')`;
		} else if (Array.isArray(elem)) {
			return elem.map((elem) => formatBson(elem));
		} else if (
			ObjectId.isValid(elem as Extract<Ark.AllElements, string | ObjectId>)
		) {
			return `ObjectId('` + elem.toString() + `')`;
		} else if (typeof elem === "object") {
			return Object.keys(elem).reduce(
				(acc, key) => ((acc[key] = formatBson(elem[key])), acc),
				{}
			);
		}
	};

	const formatQueryResult = (doc: typeof bson) =>
		Array.isArray(doc)
			? doc.map((elem) => formatBson(elem))
			: typeof bson === "object"
			? formatBson(doc)
			: bson;

	const replaceQuotes = (json: string) => {
		return json
			.replace(/"(ObjectId\(.*?\))"/g, (_, m) => m)
			.replace(/"(ISODate\(.*?\))"/g, (_, m) => m);
	};

	return (
		<div className={"JSONViewer"}>
			{replaceQuotes(JSON.stringify(formatQueryResult(bson), null, 4))}
		</div>
	);
};
