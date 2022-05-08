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
}

export const DangerousActionPrompt: FC<DangerousActionPromptProps> = ({
	title,
	prompt,
	confirmButtonText,
	onCancel,
	dangerousActionCallback,
	dangerousAction,
}) => {
	return (
		<Dialog
			size="small"
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
