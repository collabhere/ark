import React, { useCallback, useState } from "react";

export interface ConnectionFormProps {
	connectionDefaults: {
		tls: boolean | { cert: string };
	};
}

export function ConnectionForm(): JSX.Element {
	const [mongoURI, setMongoURI] = useState("");

	const saveMongoURI = useCallback(() => {
		window.ark.driver
			.run("connection", "saveConnection", {
				type: "uri",
				uri: mongoURI,
				name: "Test Connection " + new Date().valueOf(),
			})
			.then((connectionId) => {
				console.log("Saved connection id: ", connectionId);
			});
	}, [mongoURI]);

	return (
		<div>
			<input
				onChange={(e) => setMongoURI(e.target.value)}
				value={mongoURI}
				placeholder={"Enter a MongoDB URI"}
			/>
			<button onClick={() => saveMongoURI()}>Save</button>
		</div>
	);
}
