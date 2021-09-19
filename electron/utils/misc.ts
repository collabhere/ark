export const promisifyCallback =
    (thisArg: any, func: any, ...args: any) =>
        new Promise((resolve, reject) =>
            func.call(
                thisArg,
                ...args,
                (err: any, data: any) => err ? reject(err) : resolve(data)
            )
        );
