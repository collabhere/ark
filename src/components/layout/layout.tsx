import "./layout.less";

import React from "react";
import { Sidenav } from "../sidenav/sidenav";
import { Explorer } from "../explorer/Explorer";
import { Browser } from "../browser/browser";

export const Layout = (): JSX.Element => {
	return (
		<div className="Layout">
			<div>
				<Sidenav />
			</div>
			<div>
				<Explorer />
			</div>
			<div>
				<Browser />
			</div>
		</div>
	);
};
