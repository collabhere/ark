import { InputGroup } from "@blueprintjs/core";
import React, { FC, useState } from "react";
import { Dialog } from "../../common/components/Dialog";
import { PromiseCompleteCallback } from "../../common/utils/misc";

interface TextInputPromptProps {
	title: string;
	confirmButtonText?: string;
	inputs?: Array<{ initialValue?: string; label: string; key: string }>;
	onConfirm: (inputs: Record<string, string>) => Promise<any>;
	onCancel: () => void;
	onConfirmCallback: PromiseCompleteCallback;
}

export const TextInputPrompt: FC<TextInputPromptProps> = ({
	title,
	confirmButtonText,
	onCancel,
	onConfirmCallback,
	onConfirm,
	inputs,
}) => {
	const [inputValues, setInputValues] = useState(() =>
		(inputs || []).reduce((acc, input) => ((acc[input.key] = input.initialValue || ""), acc), {}),
	);
	return (
		<Dialog
			size="small"
			title={title}
			onCancel={onCancel}
			confirmButtonText={confirmButtonText}
			onConfirm={{
				promise: () => onConfirm(inputValues),
				callback: onConfirmCallback,
			}}
		>
			{inputs?.map((input) => {
				return (
					<div key={input.key}>
						<span>{input.label}</span>
						<InputGroup
							value={inputValues[input.key]}
							onChange={(e) =>
								setInputValues((state) => {
									e.target.value ? (state[input.key] = e.target.value) : (state[input.key] = "");
									return { ...state };
								})
							}
						/>
					</div>
				);
			})}
		</Dialog>
	);
};
