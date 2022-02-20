import "./Button.less";

import React, { FC, useState, useMemo } from "react";
import { Button as BPButton, ActionProps, IconName } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
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

export interface ButtonProps {
	variant?: ActionProps["intent"] | "link";
	shape?: "round" | "circle";
	text?: string;
	icon?: IconName;
	size?: "large" | "small";
	dropdownOptions?: {
		menu: JSX.Element;
	};
	popoverOptions?: {
		hover?: PopoverOptions;
		click?: PopoverOptions;
	};
	onClick?: ((e: React.MouseEvent) => void) | PromiseButtonMouseEventHandler;
}

export const Button: FC<ButtonProps> = (props) => {
	const {
		icon,
		text,
		onClick,
		popoverOptions,
		dropdownOptions,
		size,
		variant,
	} = props;

	const [loading, setLoading] = useState(false);

	const baseButton = useMemo(
		() => (
			<BPButton
				disabled={loading}
				onClick={(e) => {
					if (!popoverOptions || (popoverOptions && !popoverOptions.click))
						onClick && asyncEventOverload(setLoading, onClick, e);
				}}
				text={text}
				loading={icon ? loading : undefined}
				large={size === "large"}
				small={size === "small"}
				minimal={variant === "link"}
				intent={variant !== "link" ? variant : undefined}
				icon={icon ? icon : undefined}
			/>
		),
		[icon, loading, onClick, popoverOptions, size, text, variant]
	);

	const buttonWithPopovers = useMemo(
		() =>
			popoverOptions
				? Object.keys(popoverOptions).reduce((children, trigger) => {
						const options = popoverOptions[trigger];
						return options ? (
							<Popover2 content={options.content}>
								{React.Children.toArray(children)}
							</Popover2>
						) : (
							React.cloneElement(children)
						);
				  }, baseButton)
				: baseButton,
		[baseButton, popoverOptions]
	);

	const buttonWithPopoversAndDropdown = useMemo(
		() =>
			dropdownOptions ? (
				<Popover2 content={dropdownOptions.menu}>{buttonWithPopovers}</Popover2>
			) : (
				baseButton
			),
		[baseButton, buttonWithPopovers, dropdownOptions]
	);

	return buttonWithPopoversAndDropdown;
};
