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