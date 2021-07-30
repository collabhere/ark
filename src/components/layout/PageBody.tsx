import React from "react";

interface PageBodyProps {
	children?: React.ReactNode;
}

export const PageBody = (props: PageBodyProps): JSX.Element => {
	const { children } = props;
	return <div className="PageBody">{children}</div>;
};
