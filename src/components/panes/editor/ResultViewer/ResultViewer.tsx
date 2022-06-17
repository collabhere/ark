import React, { FC, useCallback, useState } from "react";
import { Button } from "../../../../common/components/Button";
import { Dialog } from "../../../../common/components/Dialog";
import "../../styles.less";
import "../../../../common/styles/layout.less";
import "./styles.less";
import { TreeViewer } from "./TreeViewer";
import { JSONViewer } from "./JSONViewer";
import { InputGroup, ButtonGroup } from "@blueprintjs/core";

export type ResultViewerProps = {
	type: "json" | "tree";
	bson: Ark.BSONArray;
} & {
	shellConfig: Ark.ShellConfig;
	driverConnectionId: string;
	allowDocumentEdits?: boolean;
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
		switchViews,
	} = props;

	return (
		<div className="result-viewer">
			<div className="result-viewer-header">
				<div className="header-item">
					{paramsState && (
						<span>
							Showing{" "}
							{(paramsState.queryParams.page - 1) *
								paramsState.queryParams.limit +
								1}{" "}
							to{" "}
							{(paramsState.queryParams.page - 1) *
								paramsState.queryParams.limit +
								paramsState.queryParams.limit}
						</span>
					)}
				</div>
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
						/>
						<InputGroup
							small
							value={paramsState?.queryParams.limit.toString()}
							onChange={(e) => {
								if (!isNaN(Number(e.target.value))) {
									paramsState?.changeQueryParams(
										"limit",
										Number(e.target.value)
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
			</div>
			<div className="container">
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
