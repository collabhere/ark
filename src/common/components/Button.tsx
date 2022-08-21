import "./Button.less";

import { ActionProps, Button as BPButton, Icon, IconName } from "@blueprintjs/core";
import { Popover2, Popover2Props, Tooltip2, Tooltip2Props } from "@blueprintjs/popover2";
import React, { FC, useMemo, useState } from "react";
import { asyncEventOverload, PromiseCompleteCallback } from "../utils/misc";

export interface PromiseButtonMouseEventHandler<T = any> {
	promise: (e: React.MouseEvent) => Promise<T>;
	callback: PromiseCompleteCallback;
}

export interface ButtonProps {
	variant?: ActionProps["intent"] | "link" | "link-danger";
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

	const iconSize = useMemo(() => (size === "large" ? 24 : size === "medium" ? 20 : 16), [size]);

	const baseButton = (
		<BPButton
			active={active}
			className={
				disabled
					? "button-base button-disabled" + " " + "button-text-size-" + size
					: "button-base button-" + variant + " " + "button-text-size-" + size + (outlined ? " button-outlined" : "")
			}
			disabled={loading || disabled}
			onClick={(e) => {
				onClick && asyncEventOverload(setLoading, onClick, e);
			}}
			fill={fill}
			text={text}
			loading={icon ? loading : undefined}
			large={size === "large"}
			small={size === "small"}
			minimal={variant === "link" || variant === "link-danger"}
			intent={variant !== "link" && variant !== "link-danger" ? variant : undefined}
			icon={icon ? <Icon icon={icon} size={iconSize} /> : undefined}
			rightIcon={rightIcon ? <Icon icon={rightIcon} size={iconSize} /> : undefined}
		/>
	);

	const buttonWithTooltips = tooltipOptions ? (
		<Tooltip2
			{...tooltipOptions}
			minimal
			modifiers={{
				offset: { enabled: true, options: { offset: [0, 4] } },
			}}
		>
			{baseButton}
		</Tooltip2>
	) : (
		baseButton
	);

	const buttonWithPopoversAndDropdown =
		dropdownOptions && !disabled ? (
			<Popover2 {...dropdownOptions} minimal>
				{buttonWithTooltips}
			</Popover2>
		) : (
			buttonWithTooltips
		);

	return buttonWithPopoversAndDropdown;
};
