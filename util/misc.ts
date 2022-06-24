import { ObjectId } from "bson";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const promisifyCallback = (thisArg: any, func: any, ...args: any) =>
	new Promise((resolve, reject) =>
		func.call(thisArg, ...args, (err: any, data: any) =>
			err ? reject(err) : resolve(data)
		)
	);

export const compose =
	(...fns: any[]) =>
		(): void =>
			fns.reduce((g, f) => f(g), {});

export const pick = <T extends Record<string, any>>(
	obj: T,
	keys: string[]
): any =>
	keys.reduce(
		(acc, key) => (obj[key] ? (acc[key] = obj[key]) : undefined, acc),
		{} as Record<string, any>
	);

/* A BSON Array will be an object with keys as the array index */
export const bsonTest = (bson: any): boolean => Boolean(bson && bson["0"]);

export const isObjectId = (possibleObjectId: any): boolean =>
	/^[0-9a-fA-F]{24}$/.test(
		(typeof possibleObjectId === "string" || typeof possibleObjectId !== 'object')
			? possibleObjectId
			: possibleObjectId.toString()
	);

export const isPrimitive = (val: unknown) =>
	!val || (typeof val !== "object" && !(val instanceof Date));


export function applyTimezone(date: Date, timezone: string) {
	return timezone === "local"
		? dayjs.utc(date).tz(dayjs.tz.guess()).format()
		: date.toISOString();
}

export function replaceQuotes(json: any) {
	const replacer = (_, x) => x.replace(/\\/g, "");
	return JSON.stringify(json, null, 4)
		.replace(/"(ObjectId\(.*?\))"/g, replacer)
		.replace(/"(ISODate\(.*?\))"/g, replacer);
}

export function formatBsonDocument(bson: Ark.BSONTypes, timezone = "local"): Ark.BSONTypes | undefined {
	if (isPrimitive(bson)) {
		return bson;
	} else if (bson instanceof Date) {
		return `ISODate("` + applyTimezone(bson, timezone) + `")`;
	} else if (Array.isArray(bson)) {
		return bson.map((elem) => formatBsonDocument(elem, timezone));
	} else if (
		ObjectId.isValid(bson as Extract<Ark.BSONTypes, string | ObjectId>) &&
		bson !== null
	) {
		return `ObjectId("` + bson.toString() + `")`;
	} else if (typeof bson === "object" && bson !== null && !(bson instanceof ObjectId)) {
		return Object.keys(bson).reduce<{ [k: string]: Ark.BSONTypes | undefined }>(
			(acc, key) => ((acc[key] = formatBsonDocument(bson[key], timezone)), acc),
			{}
		);
	} else if (bson === null) {
		return "null";
	}
}

export function formatBSONToText(doc: Ark.BSONArray, timezone = "local"): Ark.BSONTypes | undefined {
	return Array.isArray(doc)
		? doc.map((elem) => formatBsonDocument(elem, timezone))
		: typeof doc === "object"
			? formatBsonDocument(doc, timezone)
			: doc;
}
