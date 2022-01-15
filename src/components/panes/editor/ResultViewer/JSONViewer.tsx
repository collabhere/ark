import React, { FC } from "react";

export interface JSONViewerProps {
	bson: Ark.AnyObject;
}

export const JSONViewer: FC<JSONViewerProps> = (props) => {
	const { bson } = props;
	return <div></div>;
};
