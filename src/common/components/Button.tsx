import "./Button.less";

import React, { FC, useState, useMemo } from "react";
import { Button as AntButton, Popover as AntPopover } from "antd";
import { PromiseCompleteCallback, asyncEventOverload } from "../util";

interface PopoverOptions {
	content?: React.ReactNode;
	title: string;
}

interface ButtonProps {
	text?: string;
	icon?: React.ReactNode;
	size?: "large" | "middle" | "small";
	popoverOptions?: {
		hover?: PopoverOptions;
		click?: PopoverOptions;
	};
	onClick?:
		| (() => void)
		| {
				promise: () => Promise<void>;
				callback: PromiseCompleteCallback;
		  };
}

export const Button: FC<ButtonProps> = (props) => {
	const { icon, text, onClick, popoverOptions, size } = props;

	const [loading, setLoading] = useState(false);

	const baseButton = useMemo(
		() => (
			<AntButton
				disabled={loading}
				onClick={() => {
					if (popoverOptions && !popoverOptions.click)
						onClick && asyncEventOverload(setLoading, onClick);
				}}
				loading={icon ? loading : undefined}
				icon={
					icon ? (
						<span className={"button-icon-wrapper"}>{icon}</span>
					) : undefined
				}
				size={size || "large"}
			>
				<span>{text}</span>
			</AntButton>
		),
		[icon, loading, onClick, popoverOptions, size, text]
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

type PopoverProps = PopoverOptions & { trigger: "click" | "hover" };

const Popover: FC<PopoverProps> = (props) => {
	const { children, content, title, trigger } = props;

	console.log("Render popover", trigger, title, content);

	const [visible, setVisible] = useState(false);

	return (
		<AntPopover
			content={content}
			title={title}
			trigger={trigger}
			visible={visible}
			onVisibleChange={(visible) => setVisible(visible)}
		>
			{children}
		</AntPopover>
	);
};
