import { Spinner, SpinnerSize } from "@blueprintjs/core";
import React, { FC } from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CircularLoadingProps {
	size?: SpinnerSize;
}

export const CircularLoading: FC<CircularLoadingProps> = (props) => {
	const { size } = props;
	// return (
	// 	<Space align={"center"} size="middle">
	// 		<Spin indicator={<LoadingOutlined />} size={size || "large"} />
	// 	</Space>
	// );
	return <Spinner intent={"none"} size={size} />;
};
