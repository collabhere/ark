export const pick = <T extends Record<string, any>>(
    obj: T,
    keys: string[]
) => keys.reduce(
    (acc, key) => (obj[key] ? acc[key] = obj[key] : undefined, acc),
    {} as Record<string, any>
);
