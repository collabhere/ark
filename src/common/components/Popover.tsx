import React, { FC, useState } from "react";
import { Popover as AntPopover, PopoverProps } from "antd";

export const Popover: FC<PopoverProps> = (props) => {
	const { children, content, title, trigger } = props;

	const [visible, setVisible] = useState(false);

	return (
		<AntPopover
			content={content}
			// title={title}
			trigger={trigger}
			visible={visible}
			onVisibleChange={(visible) => setVisible(visible)}
		>
			{children}
		</AntPopover>
	);
};
