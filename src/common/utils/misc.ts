import notification, { NotificationInstance } from "antd/lib/notification";
import { ERRORS } from "../../../util/constants";
import { dispatch } from "./events";
import { pick } from "../../../util/misc";
import { Toaster, Intent } from "@blueprintjs/core";

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
	  };

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

export const getConnectionUri = ({
	hosts,
	database = "admin",
	username,
	password,
	options,
}: Ark.StoredConnection): string => {
	const querystring = new URLSearchParams(pick(options, ["authSource"]) as any);
	const userpass =
		username && password ? `${username}:${encodeURIComponent(password)}@` : "";
	const hoststring = hosts.join(",");

	return `mongodb://${userpass}${hoststring}/${database}?${querystring.toString()}`;
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

export const notify = (props: ToastProps): void => {
	const { title, description, onClick, type } = props;

	const intent: any = {
		success: Intent.SUCCESS,
		error: Intent.DANGER,
		warning: Intent.WARNING,
		info: Intent.NONE,
	};

	const icon: any = {
		success: "tick-circle",
		error: "error",
		warning: "warning-sign",
		info: "info-sign",
	};

	const toast = Toaster.create({
		className: "toast",
		position: "top-right",
	});

	toast.show({ message: description, intent: intent[type], icon: icon[type] });
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
