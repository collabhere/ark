import { notification } from "antd";

export const compose =
	(...fns: any[]) =>
	(): void =>
		fns.reduce((g, f) => f(g), {});

interface ToastProps {
	title?: string;
	description: string;
	onClick?: () => void;
}

export const notify = ({ title, description, onClick }: ToastProps): void => {
	const rootElement = document.getElementById("root");

	if (rootElement) {
		notification.open({
			message: title,
			description,
			onClick,
			getContainer: () => rootElement,
		});
	}
};
