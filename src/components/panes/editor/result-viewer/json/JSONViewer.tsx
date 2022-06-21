import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import React, { FC, useContext } from "react";
import { SettingsContext } from "../../../../layout/BaseContextProvider";
import { formatBSONToText } from "../../../../../../util/misc";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface JSONViewerProps {
	bson: Ark.BSONArray;
}

export const JSONViewer: FC<JSONViewerProps> = (props) => {
	const { bson } = props;

	const { settings } = useContext(SettingsContext);

	const replaceQuotes = (json: string) => {
		return json
			.replace(/"(ObjectId\(.*?\))"/g, (_, m) => m)
			.replace(/"(ISODate\(.*?\))"/g, (_, m) => m);
	};

	return (
		<div className={"json-viewer"}>
			{replaceQuotes(
				JSON.stringify(formatBSONToText(bson, settings?.timezone), null, 4)
			)}
		</div>
	);
};
