import { ObjectId } from "bson";
import dayjs from "dayjs";

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


export const applyTimezone = (date: Date, timezone: string) =>
	timezone === "local"
		? dayjs.utc(date).tz(dayjs.tz.guess()).format()
		: date.toISOString();

export const formatBsonDocument = (elem: Ark.BSONTypes, timezone: string) => {
	if (isPrimitive(elem)) {
		return elem;
	} else if (elem instanceof Date) {
		return `ISODate('` + applyTimezone(elem, timezone) + `')`;
	} else if (Array.isArray(elem)) {
		return elem.map((elem) => formatBsonDocument(elem, timezone));
	} else if (
		ObjectId.isValid(elem as Extract<Ark.BSONTypes, string | ObjectId>) &&
		elem !== null
	) {
		return `ObjectId('` + elem.toString() + `')`;
	} else if (typeof elem === "object" && elem !== null) {
		return Object.keys(elem).reduce(
			(acc, key) => ((acc[key] = formatBsonDocument(elem[key], timezone)), acc),
			{}
		);
	} else if (elem === null) {
		return "null";
	}
};

export const formatBSONToText = (doc: Ark.BSONArray, timezone = "local") =>
	Array.isArray(doc)
		? doc.map((elem) => formatBsonDocument(elem, timezone))
		: typeof doc === "object"
			? formatBsonDocument(doc, timezone)
			: doc;
