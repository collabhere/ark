import { ButtonGroup, InputGroup } from "@blueprintjs/core";
import React, { FC, useState } from "react";
import { Button } from "../../../../common/components/Button";
import "../../../../common/styles/layout.less";
import "../../styles.less";
import { PlainTextViewer } from "./plaintext/PlainTextViewer";
import "./styles.less";
import { TreeViewer } from "./tree/TreeViewer";

export type ResultViewerProps = {
	type: "plaintext" | "tree";
	bson: Ark.BSONArray | string;
} & {
	shellConfig: Ark.ShellConfig;
	driverConnectionId: string;
	allowDocumentEdits?: boolean;
	hidePagination?: boolean;
	forceView?: "tree" | "plaintext";
	onClose: () => void;
	onRefresh: () => void;
	switchViews?: (type: "tree" | "plaintext") => void;
	paramsState?: {
		queryParams: Ark.QueryOptions;
		changeQueryParams: (type: Exclude<keyof Ark.QueryOptions, "timeout">, value: number) => void;
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
		hidePagination,
		onRefresh,
		onClose,
		switchViews,
		forceView,
	} = props;

	const [displayLimit] = useState(paramsState?.queryParams.limit || 50);

	return (
		<div className="result-viewer">
			<div className="result-viewer-header">
				{!hidePagination && (
					<>
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
											paramsState?.changeQueryParams("page", paramsState?.queryParams.page - 1);
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
											paramsState?.changeQueryParams("limit", Number(e.currentTarget.value));
										}
									}}
								/>
								<Button
									size="small"
									icon={"arrow-right"}
									onClick={() => paramsState?.changeQueryParams("page", paramsState?.queryParams.page + 1)}
									tooltipOptions={{
										position: "top",
										content: "Next page",
									}}
								/>
							</ButtonGroup>
						</div>
					</>
				)}
				<div className="header-item">
					<ButtonGroup>
						<Button
							size="small"
							icon={"diagram-tree"}
							disabled={type === "tree" || forceView === "plaintext"}
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
							disabled={type === "plaintext" || forceView === "tree"}
							onClick={() => switchViews && switchViews("plaintext")}
							tooltipOptions={{
								disabled: type === "plaintext",
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
				{forceView === "plaintext" || type === "plaintext" ? (
					<PlainTextViewer text={bson} />
				) : forceView === "tree" || type === "tree" ? (
					<TreeViewer
						bson={bson as Ark.BSONArray}
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
