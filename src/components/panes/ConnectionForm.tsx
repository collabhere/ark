import React, { useCallback, useEffect, useState } from "react";
import { Input, Button } from "antd";
import "./panes.less";
import { MongoClientOptions } from "mongodb";
import { ConnectionDetails } from "../connectionManager/ConnectionManager";

export interface ConnectionFormProps {
	connectionParams?: ConnectionDetails & { mode?: "edit" | "clone" };
}

export function ConnectionForm(props: ConnectionFormProps): JSX.Element {
	const [type, setType] = useState<"basic" | "advanced">(
		props.connectionParams &&
			(props.connectionParams.mode === "edit" ||
				props.connectionParams.mode === "clone")
			? "advanced"
			: "basic"
	);
	const [mongoURI, setMongoURI] = useState("");
	const [connectionData, setConnectionData] = useState<
		ConnectionDetails | undefined
	>(props.connectionParams);

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
		<div className="UriContainer">
			<div className="FieldContainer">
				{type === "basic" && (
					<div className="FormWrapper">
						<div className="HeaderWrapper">
							<span>New DB Connection</span>
						</div>
						<div className="Form">
							<div className="Label">
								<span style={{ margin: "auto" }}>DB URI</span>
							</div>
							<div className="InputField">
								<Input
									className="Input"
									onChange={(e) => setMongoURI(e.target.value)}
									value={mongoURI}
								/>
							</div>
							<div className="ButtonGroup">
								<div>
									<Button type="text">Test</Button>
								</div>
								<div>
									<Button onClick={() => saveMongoURI()}>Save</Button>
								</div>
							</div>
						</div>
						<div className="Separator">
							<div className="HorizontalLine"></div>
							<div>
								<span>OR</span>
							</div>
							<div className="HorizontalLine"></div>
						</div>
						<div className="AdvancedButton" onClick={() => setType("advanced")}>
							<span>Advanced Settings</span>
						</div>
					</div>
				)}
				{type === "advanced" && (
					<div className="ConnectionFormWrapper">
						<div className="HeaderWrapper">
							<span>Connection</span>
						</div>
						<div className="Form">
							<div>
								<div className="Label">
									<span style={{ margin: "auto" }}>Type</span>
								</div>
								<div className="InputField">
									<Input className="Input" value={connectionData?.name} />
								</div>
							</div>
							<div>
								<div className="Label">
									<span style={{ margin: "auto" }}>Name</span>
								</div>
								<div className="InputField">
									<Input className="Input" value={connectionData?.name} />
								</div>
							</div>

							<div className="InlineInput">
								<div style={{ flexGrow: 1 }}>
									<div className="Label">
										<span style={{ margin: "auto" }}>Host</span>
									</div>
									<div className="InputField">
										<Input
											className="Input"
											value={connectionData?.members[0].split(":")[0]}
										/>
									</div>
								</div>
								<div>
									<div className="Label">
										<span style={{ margin: "auto" }}>Port</span>
									</div>
									<div className="InputField">
										<Input
											className="Input"
											value={connectionData?.members[0].split(":")[1]}
										/>
									</div>
								</div>
							</div>
						</div>
						<div className="ButtonGroupAdvanced">
							<div className="BackContainer" onClick={() => setType("basic")}>
								<span>Back</span>
							</div>
							<div className="ButtonGroup">
								<div>
									<Button type="text" onClick={() => saveMongoURI()}>
										Test
									</Button>
								</div>
								<div>
									<Button onClick={() => saveMongoURI()}>Save</Button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
