export const compose =
	(...fns: any[]) =>
	(): void =>
		fns.reduce((g, f) => f(g), {});
