import { LoadingOutlined } from "@ant-design/icons";
import { Space, Spin } from "antd";
import React, { FC } from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CircularLoadingProps {}

export const CircularLoading: FC<CircularLoadingProps> = () => {
	return (
		<Space align={"center"} size="middle">
			<Spin indicator={<LoadingOutlined />} size="large" />
		</Space>
	);
};
