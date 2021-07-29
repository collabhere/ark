import { compose } from "./misc";

export const dispatch = (event: string, payload?: any): void => {
    const e = new CustomEvent(event, { detail: payload });
    window.dispatchEvent(e);
}

export const listenEffect = (
    listeners: Array<{ event: string; cb: (...args: any[]) => void }>
): () => void => {
    const unmounts = listeners.map((listener) => {
        window.addEventListener(listener.event, listener.cb);
        return () => window.removeEventListener(listener.event, listener.cb);
    });
    return compose(...unmounts);
};
