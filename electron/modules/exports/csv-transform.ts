import { ObjectId } from "mongodb";
import { Transform } from "stream";

interface ImportOptions {
	fields?: Array<string>;
}

interface CsvCell { header: string, value: string };

type Chunk = Record<string, any> | number | string | boolean | Date | ObjectId;

const formatHeaders = (headers: Set<string>, delim = ",") => [...headers].join(delim) + "\n";

const formatRow = (headers: Set<string>, cells: CsvCell[], delim = ",") =>
	[...headers]
		.map((head) => (cells.find((cell) => cell.header === head)?.value || ""))
		.join(delim) + "\n";

const addCells = (
	document: Chunk,
	cells: CsvCell[] = [],
	headers = new Set(),
	path: string[] = [],
	onlyHeaders = false
) => {
	const add = (header: string, value: Chunk) => {
		if (onlyHeaders) {
			if (headers.has(header))
				cells.push({
					header,
					value: String(value),
				});
		} else {
			headers.add(header);
			cells.push({
				header,
				value: String(value),
			});
		}
	};

	if (
		typeof document === "number" ||
		typeof document === "string" ||
		typeof document === "boolean" ||
		document instanceof Date ||
		(typeof document !== "object" && ObjectId.isValid(document)) ||
		document == null
	) {
		return add(path.join("."), document);
	}
	for (const [key, value] of Object.entries(document)) {
		if (Array.isArray(value)) {
			value.forEach((x, idx) =>
				addCells(x, cells, headers, [...path, String(key), String(idx)], onlyHeaders)
			);
		} else if (typeof value === "object" && !(value instanceof Date)) {
			addCells(value, cells, headers, [...path, String(key)], onlyHeaders);
		} else if (
			typeof value === "number" ||
			typeof value === "string" ||
			typeof value === "boolean" ||
			value instanceof Date ||
			(typeof document !== "object" && ObjectId.isValid(document)) ||
			document == null
		) {
			const header = [...path, String(key)].join(".");
			add(header, value);
		}
	}
};


export const CSVTransform = (options: ImportOptions) => {

	const headers = new Set<string>(!!options.fields?.length ? options.fields : []);

	return new Transform({
		objectMode: true,
		flush(callback) {
			callback(undefined, { header: formatHeaders(headers) });
		},
		transform(
			chunk: Record<string, any>,
			encoding: string,
			callback: (err?: Error, value?: { row: string }) => void
		) {
			try {
				const cells: CsvCell[] = [];

				addCells(chunk, cells, headers, [], !!options.fields?.length);

				callback(undefined, { row: formatRow(headers, cells) });

			} catch (err: any) {
				callback(err);
			}
		},
	});
};
