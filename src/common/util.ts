export type PromiseCompleteCallback = (err?: Error, data?: any) => void;

export type OneKey<K extends string, V = any> = {
    [P in K]: Record<P, V> & Partial<Record<Exclude<K, P>, never>> extends infer O
    ? { [Q in keyof O]: O[Q] }
    : never;
}[K];

export const asyncEventOverload = (
    loadingFn: (val: boolean) => void,
    fn:
        | ((...args) => void)
        | {
            promise: (...args) => Promise<any>;
            callback: PromiseCompleteCallback;
        },
    ...args: any[]
): Promise<void> => {
    if (typeof fn === "function") {
        return Promise.resolve(fn(...args));
    } else if (typeof fn === "object") {
        loadingFn(true);
        return fn
            .promise(...args)
            .then((result) => (loadingFn(false), fn.callback(undefined, result)))
            .catch((err) => fn.callback(err));
    } else {
        return Promise.reject(new Error("Invalid table event handler"));
    }
};

export const pick = <T extends Record<string, any>>(
    obj: T,
    keys: string[]
) => keys.reduce(
    (acc, key) => (obj[key] ? acc[key] = obj[key] : undefined, acc),
    {} as Record<string, any>
);


export const getConnectionUri = ({
    hosts,
    database = "admin",
    username,
    password,
    options,
}: Ark.StoredConnection): string => {

    const querystring = new URLSearchParams(pick(options, ["authSource"]) as any);

    const userpass = username && password ? `${username}:${encodeURIComponent(password)}@` : "";

    const hoststring = hosts.join(",");

    return `mongodb://${userpass}${hoststring}/${database}?${querystring.toString()}`;
};
