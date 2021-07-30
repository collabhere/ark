import React from "react";

export interface ConnectionFormProps {
	connectionDefaults: {
		tls: boolean | { cert: string };
	};
}

export function ConnectionForm(): JSX.Element {
	return <div></div>;
}
