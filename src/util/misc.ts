import notification, { NotificationInstance } from "antd/lib/notification";
import { ERRORS } from "./constants";

export const compose =
	(...fns: any[]) =>
	(): void =>
		fns.reduce((g, f) => f(g), {});

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

export const handleErrors = (err: Error): void => {
	switch (err.message) {
		case (ERRORS.AR600, ERRORS.AR601): {
			notify({
				description: err.message,
				type: "error",
			});
		}
	}
};
