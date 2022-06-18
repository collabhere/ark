import "./Button.less";

import React, { FC, useState, useMemo } from "react";
import { Button as BPButton, ActionProps, IconName } from "@blueprintjs/core";
import {
	Popover2,
	Popover2Props,
	Tooltip2,
	Tooltip2Props,
} from "@blueprintjs/popover2";
import { PromiseCompleteCallback, asyncEventOverload } from "../utils/misc";

export interface PromiseButtonMouseEventHandler<T = any> {
	promise: (e: React.MouseEvent) => Promise<T>;
	callback: PromiseCompleteCallback;
}

export interface ButtonProps {
	variant?: ActionProps["intent"] | "link";
	shape?: "round" | "circle";
	text?: React.ReactNode;
	icon?: IconName;
	active?: boolean;
	rightIcon?: IconName;
	size?: "large" | "small" | "medium";
	disabled?: boolean;
	dropdownOptions?: Popover2Props;
	outlined?: boolean;
	tooltipOptions?: Tooltip2Props;
	onClick?: ((e: React.MouseEvent) => void) | PromiseButtonMouseEventHandler;
	fill?: boolean;
}

export const Button: FC<ButtonProps> = (props) => {
	const {
		icon,
		rightIcon,
		text,
		active,
		onClick,
		tooltipOptions,
		dropdownOptions,
		size = "medium",
		variant = "none",
		outlined,
		disabled,
		fill,
	} = props;

	const [loading, setLoading] = useState(false);

	const baseButton = (
		<BPButton
			active={active}
			className={"button-" + variant + " " + "button-text-size-" + size}
			disabled={loading || disabled}
			onClick={(e) => {
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

	const buttonWithTooltips = tooltipOptions ? (
		<Tooltip2 {...tooltipOptions}>{baseButton}</Tooltip2>
	) : (
		baseButton
	);

	const buttonWithPopoversAndDropdown = dropdownOptions ? (
		<Popover2 {...dropdownOptions}>{buttonWithTooltips}</Popover2>
	) : (
		buttonWithTooltips
	);

	return buttonWithPopoversAndDropdown;
};
