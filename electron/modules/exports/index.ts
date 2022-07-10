import { createWriteStream, promises as fs } from "fs";
import { Transform } from "stream";
import path from "path";
import { CSVTransform } from "./csv-transform";
import { NDJSONTransform } from "./ndjson-transform";

export type MongoExportOptions = (Ark.ExportCsvOptions | Ark.ExportNdjsonOptions);

export async function exportData(
	result: any,
	options: MongoExportOptions
) {
	return new Promise<string>((resolve, reject) => {

		const filePath = path.join(options.saveLocation, options.fileName);

		const reader = result._cursor.stream();
		let transformer: Transform;
		const writer = createWriteStream(filePath);

		writer.on("error", (err) => {
			reject(err);
		});

		writer.on("close", () => {
			resolve(filePath);
		});

		if (options.type === "CSV") {
			transformer = CSVTransform({
				fields: options.fields,
			});

			transformer.on("data", async (chunk) => {
				if (chunk.row) {
					if (!writer.write(chunk.row)) {
						transformer.pause();
						writer.on("drain", () => {
							transformer.resume();
						});
					}
				} else if (chunk.header) {
					writer.close();
					// Since we write the rows first, we can
					// only add the headers to the first line
					// by rewriting the file with the
					// header first.
					const csv = await fs.readFile(filePath);
					const handle = await fs.open(filePath, 'w+');
					await fs.writeFile(handle, chunk.header);
					await fs.writeFile(handle, csv);
					await handle.close();
				}
			});

			transformer.on("error", (err) => reject(err));

			reader.pipe(transformer);
		} else {
			transformer = NDJSONTransform();

			transformer.on("error", (err) => reject(err));

			reader.pipe(transformer).pipe(writer);
		}

	});
}
