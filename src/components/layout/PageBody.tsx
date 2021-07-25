import React from "react";
import { Resizable } from "re-resizable";

import { SideBar } from "../sidebar/sidebar";
import { Browser } from "../browser/Browser";

interface PageBodyProps {
	children?: React.ReactNode;
}

export const PageBody = (props: PageBodyProps): JSX.Element => {
	const { children } = props;
	return (
		<div className="PageBody">
			<SideBar />
			<Resizable
				defaultSize={{
					width: "20%",
					height: "100%",
				}}
				maxWidth="40%"
				minWidth="20%"
				minHeight="100%"
			>
				{children || <div className={"PageBodyEmptyState"}></div>}
			</Resizable>
			<Browser />
		</div>
	);
};
