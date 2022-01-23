import { LoadingOutlined } from "@ant-design/icons";
import { Space, Spin } from "antd";
import { SpinSize } from "antd/lib/spin";
import React, { FC } from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CircularLoadingProps {
	size?: SpinSize;
}

export const CircularLoading: FC<CircularLoadingProps> = (props) => {
	const { size } = props;
	return (
		<Space align={"center"} size="middle">
			<Spin indicator={<LoadingOutlined />} size={size || "large"} />
		</Space>
	);
};
