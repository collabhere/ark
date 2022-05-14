import React, { useCallback, useEffect, useState } from "react";
import "../../../common/styles/layout.less";
import "./styles.less";
import { CollStats, Document } from "mongodb";
import { formatBytes } from "../../../../util/misc";
import { Cell, Column, Table2 } from "@blueprintjs/table";
import { Button } from "../../../common/components/Button";
import { ProgressBar } from "@blueprintjs/core";

interface defaultProps {
	contextDB: string;
	collection: string;
	id: string;
	storedConnectionId: string;
}

export interface IndexPaneProps extends defaultProps {
	indexes: Document[];
	collectionStats: CollStats;
}

export function Index(props: IndexPaneProps): JSX.Element {
	useEffect(() => {
		console.log("Inside index pane useEffect");
		console.log(props);
	}, [props]);

	const { indexes, collectionStats, ...args } = props;

	const [tableRows, setTableRows] = useState<Document[]>([]);

	useEffect(() => {
		if (indexes && collectionStats) {
			const rows = indexes.map((index) => {
				if (index && collectionStats.indexSizes) {
					const size = formatBytes(collectionStats.indexSizes[index.name]);
					const storagePercentage =
						collectionStats.indexSizes[index.name] /
						collectionStats.totalIndexSize;

					return {
						...index,
						size,
						storagePercentage,
					};
				}

				return index;
			});

			setTableRows(rows);
		}
	}, [collectionStats, indexes]);

	return (
		<div className="IndexContainer">
			<StatsHeader stats={collectionStats} />
			<IndexTable {...args} rows={tableRows} columns={[]} />
		</div>
	);
}

interface StatsHeaderProps {
	stats: CollStats;
}

const StatsHeader = function (props: StatsHeaderProps): JSX.Element {
	const { stats } = props;

	return (
		<div>
			<h3 className={"CollectionNamespace"}>{stats.ns}</h3>
			<div className={"StatsRow"}>
				<span className="StatsHeader">
					STORAGE SIZE:{" "}
					<span className={"StatsValue"}>{formatBytes(stats.storageSize)}</span>
				</span>
				<span className="StatsHeader">
					TOTAL DOCUMENTS: <span className={"StatsValue"}>{stats.count}</span>
				</span>
				<span className="StatsHeader">
					INDEXES TOTAL SIZE:{" "}
					<span className={"StatsValue"}>
						{formatBytes(stats.totalIndexSize)}
					</span>
				</span>
			</div>
		</div>
	);
};

interface IndexTableProps extends defaultProps {
	rows: Document[];
	columns: any[];
}

const IndexTable = function (props: IndexTableProps): JSX.Element {
	const { rows, columns, storedConnectionId, contextDB, collection } = props;
	const [isLoading, setIsLoading] = useState(false);

	const dropIndexClickHandler = useCallback(
		(indexName: string) => {
			setIsLoading(true);
			window.ark.driver
				.run("database", "dropIndex", {
					id: storedConnectionId,
					database: contextDB,
					collection: collection,
					index: indexName,
				})
				.then(() => setIsLoading(false));
		},
		[collection, contextDB, storedConnectionId]
	);

	const nameRenderer = (rowIndex: number) => {
		const data = rows[rowIndex];
		return <Cell>{data && <span>{data.name}</span>}</Cell>;
	};

	const keyRenderer = (rowIndex: number) => {
		const data = rows[rowIndex];
		return <Cell>{data && <span>{JSON.stringify(data.key)}</span>}</Cell>;
	};

	const sizeRenderer = (rowIndex: number) => {
		const data = rows[rowIndex];
		return (
			<Cell>
				{data && (
					<div>
						<span>{data.size}</span>
						{data.storagePercentage && (
							<ProgressBar intent={"primary"} value={data.storagePercentage} />
						)}
					</div>
				)}
			</Cell>
		);
	};

	const opsRenderer = (rowIndex: number) => {
		const data = rows[rowIndex];
		return <Cell>{data && <span>{data.accesses.ops}</span>}</Cell>;
	};

	const dropIndexRenderer = (rowIndex: number) => {
		const data = rows[rowIndex];
		return (
			<Cell loading={isLoading}>
				{data && (
					<Button
						text={"Drop Index"}
						onClick={() => dropIndexClickHandler(data.name)}
						size={"small"}
					/>
				)}
			</Cell>
		);
	};

	return (
		<Table2 numRows={rows.length}>
			<Column name="Name" cellRenderer={nameRenderer}></Column>
			<Column name="Key" cellRenderer={keyRenderer}></Column>
			<Column name="Size" cellRenderer={sizeRenderer}></Column>
			<Column name="Operations" cellRenderer={opsRenderer}></Column>
			<Column name="" cellRenderer={dropIndexRenderer}></Column>
		</Table2>
	);
};
