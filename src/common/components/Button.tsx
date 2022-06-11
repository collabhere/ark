import "./Button.less";

import React, { FC, useState, useMemo } from "react";
import { Button as BPButton, ActionProps, IconName } from "@blueprintjs/core";
import { Popover2, Popover2Props } from "@blueprintjs/popover2";
import { PromiseCompleteCallback, asyncEventOverload } from "../utils/misc";

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
	rightIcon?: IconName;
	size?: "large" | "small";
	disabled?: boolean;
	dropdownOptions?: Popover2Props;
	outlined?: boolean;
	tooltipOptions?: {
		hover?: PopoverOptions;
		click?: PopoverOptions;
	};
	onClick?: ((e: React.MouseEvent) => void) | PromiseButtonMouseEventHandler;
	fill?: boolean;
}

export const Button: FC<ButtonProps> = (props) => {
	const {
		icon,
		rightIcon,
		text,
		onClick,
		tooltipOptions,
		dropdownOptions,
		size,
		variant,
		outlined,
		disabled,
		fill,
	} = props;

	const [loading, setLoading] = useState(false);

	const baseButton = (
		<BPButton
			disabled={loading || disabled}
			onClick={(e) => {
				if (!tooltipOptions || (tooltipOptions && !tooltipOptions.click))
					onClick && asyncEventOverload(setLoading, onClick, e);
			}}
			outlined={outlined}
			fill={fill}
			text={text}
			loading={icon ? loading : undefined}
			large={size === "large"}
			small={size === "small"}
			minimal={variant === "link"}
			intent={variant !== "link" ? variant : undefined}
			icon={icon ? icon : undefined}
			rightIcon={rightIcon ? rightIcon : undefined}
		/>
	);

	const buttonWithPopoversAndDropdown = dropdownOptions ? (
		<Popover2 {...dropdownOptions}>{baseButton}</Popover2>
	) : (
		baseButton
	);

	return buttonWithPopoversAndDropdown;
};
