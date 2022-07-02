import React, { FC, useState } from "react";
import { Button } from "../../../../common/components/Button";
import "../../styles.less";
import "../../../../common/styles/layout.less";
import "./styles.less";
import { TreeViewer } from "./tree/TreeViewer";
import { JSONViewer } from "./json/JSONViewer";
import { InputGroup, ButtonGroup } from "@blueprintjs/core";

export type ResultViewerProps = {
	type: "json" | "tree";
	bson: Ark.BSONArray;
} & {
	shellConfig: Ark.ShellConfig;
	driverConnectionId: string;
	allowDocumentEdits?: boolean;
	onClose: () => void;
	onRefresh: () => void;
	switchViews?: (type: "tree" | "json") => void;
	paramsState?: {
		queryParams: Ark.QueryOptions;
		changeQueryParams: (
			type: Exclude<keyof Ark.QueryOptions, "timeout">,
			value: number
		) => void;
	};
};

export const ResultViewer: FC<ResultViewerProps> = (props) => {
	const {
		bson,
		type,
		paramsState,
		driverConnectionId,
		shellConfig,
		allowDocumentEdits,
		onRefresh,
		onClose,
		switchViews,
	} = props;

	const [displayLimit] = useState(paramsState?.queryParams.limit || 50);

	return (
		<div className="result-viewer">
			<div className="result-viewer-header">
				{/* <div className="header-item">
					
				</div> */}

				{paramsState && (
					<div className="header-item">
						<span>Page: {paramsState.queryParams.page}</span>
						<span>Limit: {displayLimit}</span>
					</div>
				)}
				<div className="header-item">
					<ButtonGroup>
						<Button
							size="small"
							icon={"arrow-left"}
							disabled={paramsState && paramsState.queryParams.page <= 0}
							onClick={() => {
								if (paramsState && paramsState.queryParams.page > 1) {
									paramsState?.changeQueryParams(
										"page",
										paramsState?.queryParams.page - 1
									);
								}
							}}
							tooltipOptions={{
								position: "top",
								content: "Previous page",
							}}
						/>
						<InputGroup
							small
							value={paramsState?.queryParams.limit.toString()}
							onChange={(e) => {
								if (!isNaN(Number(e.currentTarget.value))) {
									paramsState?.changeQueryParams(
										"limit",
										Number(e.currentTarget.value)
									);
								}
							}}
						/>
						<Button
							size="small"
							icon={"arrow-right"}
							onClick={() =>
								paramsState?.changeQueryParams(
									"page",
									paramsState?.queryParams.page + 1
								)
							}
							tooltipOptions={{
								position: "top",
								content: "Next page",
							}}
						/>
					</ButtonGroup>
				</div>
				<div className="header-item">
					<ButtonGroup>
						<Button
							size="small"
							icon={"diagram-tree"}
							disabled={type === "tree"}
							onClick={() => switchViews && switchViews("tree")}
							tooltipOptions={{
								disabled: type === "tree",
								position: "top-left",
								content: "Switch to Tree View",
							}}
						/>
						<Button
							size="small"
							icon={"list-detail-view"}
							disabled={type === "json"}
							onClick={() => switchViews && switchViews("json")}
							tooltipOptions={{
								disabled: type === "json",
								position: "top-left",
								content: "Switch to JSON View",
							}}
						/>
					</ButtonGroup>
				</div>
				<div className="header-item">
					<Button
						size="small"
						icon={"small-cross"}
						onClick={() => onClose()}
						tooltipOptions={{
							position: "top-left",
							content: "Close",
						}}
					/>
				</div>
			</div>
			<div className="result-viewer-container">
				{type === "json" ? (
					<JSONViewer bson={bson} />
				) : type === "tree" ? (
					<TreeViewer
						bson={bson}
						driverConnectionId={driverConnectionId}
						shellConfig={shellConfig}
						onRefresh={onRefresh}
						allowDocumentEdits={allowDocumentEdits || false}
					/>
				) : (
					<div>{"Incorrect view type!"}</div>
				)}
			</div>
		</div>
	);
};
