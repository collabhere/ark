import "./styles.less";
import React, { FC } from "react";

import { ReactComponent as Logo } from "../../assets/logo_fill.svg";

export const EmptyState: FC = () => {
	return (
		<div className="empty-state">
			<Logo height={"35rem"} width={"35rem"} opacity={"50%"} />
			<div className="text-row">
				<div className="text-row-key">See connections</div>
				<code className="text-row-value">Ctrl/Cmd + E</code>
			</div>
		</div>
	);
};
