import { ObjectId } from "mongodb";
import { Transform } from "stream";

interface ImportOptions {
	destructureData?: boolean;
	fields?: Array<string>;
}

const convertToCsv = ({ destructureData, fields }: ImportOptions) => {
	let rowsProcessed = false;

	const isPrimitive = (val: any) =>
		typeof val !== "object" || val instanceof Date || ObjectId.isValid(val);

	const getPostfix = (val: any, prop: string | number) =>
		isPrimitive(val) ? `.${prop}` : "";

	const getPrefix = (val: string, delimiter: "," | ".") =>
		!!val ? `${val}${delimiter}` : "";

	const destructureKeys = (
		doc: Record<string, any>,
		key: string | number,
		join: string
	): string | number => {
		if (isPrimitive(doc[key])) {
			return join ? join : key;
		} else {
			if (Array.isArray(doc[key])) {
				return doc[key]
					.map((val: any, index: number) =>
						destructureKeys(
							doc[key],
							index,
							`${getPrefix(join, ".")}${key}${getPostfix(val, index)}`
						)
					)
					.join(",");
			} else {
				return Object.keys(doc[key])
					.map((prop) =>
						destructureKeys(
							doc[key],
							prop,
							`${getPrefix(join, ".")}${key}${getPostfix(doc[key][prop], prop)}`
						)
					)
					.join(",");
			}
		}
	};

	const destructureValues = (doc: any): string => {
		if (isPrimitive(doc)) {
			return doc.toString();
		} else if (doc && typeof doc === "object" && Array.isArray(doc)) {
			return doc.map((val) => destructureValues(val)).join(",");
		} else if (doc && typeof doc === "object" && !Array.isArray(doc)) {
			return Object.values(doc)
				.map((val) => destructureValues(val))
				.join(",");
		} else {
			return doc;
		}
	};

	const processFields = (chunk: Record<string, any>) => {
		rowsProcessed = true;
		return fields
			? fields.join(",")
			: destructureData
			? Object.keys(chunk).reduce(
					(acc, key) => (
						(acc = `${getPrefix(acc, ",")}${destructureKeys(chunk, key, "")}`),
						acc
					),
					""
			  )
			: Object.keys(chunk).join(",");
	};

	const processData = (chunk: Record<string, any>): string =>
		Object.values(chunk).reduce((acc, val) => {
			acc = destructureData
				? `${getPrefix(acc, ",")}${destructureValues(val)}`
				: `${getPrefix(acc, ",")}${
						!isPrimitive(val) ? JSON.stringify(val) : val
				  }`;

			return acc;
		}, "");

	return (chunk: Record<string, any>) => {
		const rows = !rowsProcessed ? `${processFields(chunk)}\n` : "";
		const values = `${processData(chunk)}\n`;

		return Promise.resolve(`${rows}${values}`);
	};
};

export const CSVTransform = (options: ImportOptions) => {
	const csvFormatter = convertToCsv(options);

	return new Transform({
		objectMode: true,

		transform(
			chunk: Record<string, any>,
			encoding: string,
			callback: (err?: Error, value?: string) => void
		) {
			csvFormatter(chunk)
				.then((res) => {
					callback(undefined, res);
				})
				.catch((err) => {
					callback(err);
				});
		},

		final() {
			console.log("Export completed.");
		},
	});
};
