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

export const bsonTest = (bson: any): boolean =>
	Boolean(bson && (bson["0"] || bson["1"]));

export const formatBytes = (bytes: number, decimals = 2): string => {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};
