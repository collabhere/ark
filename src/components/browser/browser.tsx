import "./browser.less";

import React from "react";

export const Browser = (): JSX.Element => {
	return (
		<div className="Browser">
			<div>Tabs</div>
			<div className="resizable">Shell</div>
			<div className="resizable">Result</div>
		</div>
	);
};
