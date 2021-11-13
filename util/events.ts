import { compose } from "./misc";

export const dispatch = <T = unknown>(event: string, payload?: T): void => {
	console.log(`[event] name=${event} payload=${JSON.stringify(payload)}`);
	const e = new CustomEvent<T>(event, { detail: payload });
	window.dispatchEvent(e);
};

export const listenEffect = (
	listeners: Array<{ event: string; cb: (event: string, payload: any) => void }>
): (() => void) => {
	const unmounts = listeners.map((listener) => {
		const l = (event: Event) =>
			listener.cb(listener.event, (event as CustomEvent).detail);
		window.addEventListener(listener.event, l);
		return () => window.removeEventListener(listener.event, l);
	});
	return compose(...unmounts);
};
