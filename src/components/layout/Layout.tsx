import "./layout.less";

import { Resizable } from "re-resizable";
import React from "react";
import { Sidenav } from "../sidenav/sidenav";
import { Explorer } from "../explorer/Explorer";
import { Browser } from "../browser/Browser";

export const Layout = (): JSX.Element => {
	return (
		<div className="Layout">
			<div className="PageHeader"></div>
			<div className="PageBody">
				<Sidenav />
				<Resizable
					defaultSize={{
						width: "20%",
						height: "100%",
					}}
					maxWidth="40%"
					minWidth="20%"
					minHeight="100%"
				>
					<Explorer title={"Connection name"} />
				</Resizable>
				<Browser />
			</div>
		</div>
	);
};
