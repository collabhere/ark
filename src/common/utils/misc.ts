import notification, { NotificationInstance } from "antd/lib/notification";
import { ERRORS } from "../../../util/constants";
import { dispatch } from "./events";
import { pick } from "../../../util/misc";

export type PromiseCompleteCallback = (err?: Error, data?: any) => void;

export type OneKey<K extends string, V = any> = {
	[P in K]: Record<P, V> & Partial<Record<Exclude<K, P>, never>> extends infer O
	? { [Q in keyof O]: O[Q] }
	: never;
}[K];

export type EventOverloadMethod =
	| ((...args) => void)
	| {
		promise: (...args) => Promise<any>;
		callback: PromiseCompleteCallback;
	}

export const asyncEventOverload = (
	loadingFn: (val: boolean) => void,
	fn: EventOverloadMethod,
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

interface ToastProps {
	title?: string;
	description: string;
	onClick?: () => void;
	type: Extract<
		keyof NotificationInstance,
		"success" | "error" | "warning" | "info"
	>;
}

export const notify = ({
	title,
	description,
	onClick,
	type,
}: ToastProps): void => {
	const rootElement = document.getElementById("root");
	const notifyFunc = notification[type];

	if (rootElement && notifyFunc) {
		notifyFunc({
			message: title,
			description,
			onClick,
			getContainer: () => rootElement,
			className: "notification",
		});
	}
};

export const handleErrors = (
	err: Error | string | unknown,
	connectionId?: string
): void => {
	const error =
		err instanceof Error
			? err.message
			: typeof err === "string"
				? err
				: undefined;

	switch (error) {
		case ERRORS.AR600:
		case ERRORS.AR601: {
			console.log(error);
			if (connectionId) {
				dispatch("connection_manager:disconnect", { connectionId });
			}

			break;
		}
		default: {
			console.log(error);
		}
	}

	if (error) {
		notify({
			description: error,
			type: "error",
		});
	}
};
