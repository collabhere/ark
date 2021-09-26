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
