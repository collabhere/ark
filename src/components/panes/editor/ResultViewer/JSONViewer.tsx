import { ObjectId } from "bson";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import React, { FC, useContext } from "react";
import { SettingsContext } from "../../../../App";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface JSONViewerProps {
	bson: Ark.BSONArray;
}

export const JSONViewer: FC<JSONViewerProps> = (props) => {
	const { bson } = props;
	const isPrimitive = (val: unknown) =>
		!val || (typeof val !== "object" && !(val instanceof Date));

	const { settings } = useContext(SettingsContext);

	const applyTimezone = (date: Date) =>
		settings?.timezone === "local"
			? dayjs.utc(date).tz(dayjs.tz.guess()).format()
			: date.toISOString();

	const formatBson = (elem: Ark.BSONTypes) => {
		if (isPrimitive(elem)) {
			return elem;
		} else if (elem instanceof Date) {
			return `ISODate('` + applyTimezone(elem) + `')`;
		} else if (Array.isArray(elem)) {
			return elem.map((elem) => formatBson(elem));
		} else if (
			ObjectId.isValid(elem as Extract<Ark.BSONTypes, string | ObjectId>) &&
			elem !== null
		) {
			return `ObjectId('` + elem.toString() + `')`;
		} else if (typeof elem === "object" && elem !== null) {
			return Object.keys(elem).reduce(
				(acc, key) => ((acc[key] = formatBson(elem[key])), acc),
				{}
			);
		} else if (elem === null) {
			return "null";
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
		<div className={"json-viewer"}>
			{replaceQuotes(JSON.stringify(formatQueryResult(bson), null, 4))}
		</div>
	);
};
