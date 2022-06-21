import React, { FC } from "react";
import { Dialog } from "../../common/components/Dialog";
import { PromiseCompleteCallback } from "../../common/utils/misc";

interface DangerousActionPromptProps {
	title: string;
	confirmButtonText?: string;
	prompt: string | React.ReactNode;
	dangerousAction: (e: React.MouseEvent) => Promise<any>;
	onCancel: () => void;
	dangerousActionCallback: PromiseCompleteCallback;
	size?: "small" | "large";
}

export const DangerousActionPrompt: FC<DangerousActionPromptProps> = ({
	title,
	prompt,
	confirmButtonText,
	onCancel,
	dangerousActionCallback,
	dangerousAction,
	size = "small",
}) => {
	return (
		<Dialog
			size={size}
			variant="danger"
			title={title}
			onCancel={onCancel}
			confirmButtonText={confirmButtonText}
			onConfirm={{
				promise: dangerousAction,
				callback: dangerousActionCallback,
			}}
		>
			{prompt}
		</Dialog>
	);
};
