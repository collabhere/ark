import { createWriteStream } from "fs";
import { Transform } from "stream";
import { ARK_FOLDER_PATH } from "../../utils/constants";
import { CSVTransform } from "./csv-transform";
import { NDJSONTransform } from "./ndjson-transform";

export interface MongoExportOptions<T> {
	mode: "export";
	params: T & (Ark.ExportCsvOptions | Ark.ExportNdjsonOptions);
}

export async function exportData(
	result: any,
	options: MongoExportOptions<unknown>
) {
	const params = options.params;
	const suffix =
		params.type === "CSV"
			? !/\.csv$/i.test(params.fileName)
				? ".csv"
				: ""
			: !/\.ndjson$/.test(params.fileName)
			? ".ndjson"
			: "";

	const fileName = params.fileName
		? `${params.fileName}${suffix}`
		: `${new Date().toISOString()}${suffix}`;

	const write = createWriteStream(`${ARK_FOLDER_PATH}/exports/${fileName}`);

	let transform: Transform;
	if (params.type === "CSV") {
		transform = CSVTransform({
			destructureData: params.destructureData,
			fields: params.fields ? [...params.fields] : undefined,
		});
	} else {
		transform = NDJSONTransform();
	}

	return new Promise((resolve, reject) => {
		const stream = result._cursor.stream();

		transform.on("error", (err) => {
			reject(err);
		});

		write.on("close", () => {
			resolve("");
		});

		stream.pipe(transform).pipe(write);
	});
}
