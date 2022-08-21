import React, { FC } from "react";
import "./styles.less";

import { ReactComponent as Logo } from "../../assets/logo_fill.svg";

export const EmptyState: FC = () => {
	return (
		<div className="empty-state">
			<Logo height={"25rem"} width={"25rem"} opacity={"40%"} />
			<div className="text-row">
				<div className="text-row-key">See connections</div>
				<code className="text-row-value">Ctrl/Cmd + E</code>
			</div>
			<div className="text-row">
				<div className="text-row-key">New connection</div>
				<code className="text-row-value">Ctrl/Cmd + N</code>
			</div>
			<div className="text-row">
				<div className="text-row-key">Open a script</div>
				<code className="text-row-value">Ctrl/Cmd + O</code>
			</div>
		</div>
	);
};
