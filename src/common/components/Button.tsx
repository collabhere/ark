import "./Button.less";

import React, { FC, useState, useMemo } from "react";
import { Button as BPButton, ActionProps } from "@blueprintjs/core";
import { PromiseCompleteCallback, asyncEventOverload } from "../utils/misc";
import { Popover } from "./Popover";

export interface PromiseButtonMouseEventHandler {
	promise: (e: React.MouseEvent) => Promise<void>;
	callback: PromiseCompleteCallback;
}

interface PopoverOptions {
	content?: React.ReactNode;
	title?: string;
}

interface ButtonProps {
	variant?: ActionProps["intent"] | "link";
	shape?: "round" | "circle";
	text?: string;
	icon?: React.ReactNode;
	size?: "large" | "small";
	popoverOptions?: {
		hover?: PopoverOptions;
		click?: PopoverOptions;
	};
	onClick?: ((e: React.MouseEvent) => void) | PromiseButtonMouseEventHandler;
}

export const Button: FC<ButtonProps> = (props) => {
	const { icon, text, onClick, popoverOptions, size, variant } = props;

	const [loading, setLoading] = useState(false);

	const baseButton = useMemo(
		() => (
			<BPButton
				disabled={loading}
				onClick={(e) => {
					if (!popoverOptions || (popoverOptions && !popoverOptions.click))
						onClick && asyncEventOverload(setLoading, onClick, e);
				}}
				loading={icon ? loading : undefined}
				large={size === "large"}
				small={size === "small"}
				outlined={variant === "link"}
				intent={variant !== "link" ? variant : undefined}
				icon={
					icon ? (
						<span className={"button-icon-wrapper"}>{icon}</span>
					) : undefined
				}
			>
				{text && <span>{text}</span>}
			</BPButton>
		),
		[icon, loading, onClick, popoverOptions, size, text, variant]
	);

	const buttonWithPopovers = useMemo(
		() =>
			popoverOptions
				? Object.keys(popoverOptions).reduce((children, trigger) => {
						const options = popoverOptions[trigger];
						return options ? (
							<Popover
								trigger={trigger as "click" | "hover"}
								content={options.content}
								title={options.title}
							>
								{React.Children.toArray(children)}
							</Popover>
						) : (
							React.cloneElement(children)
						);
				  }, baseButton)
				: baseButton,
		[baseButton, popoverOptions]
	);

	return buttonWithPopovers;
};
