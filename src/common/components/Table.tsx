import React, { useState, PropsWithChildren } from "react";
import { Table as AntTable } from "antd";
import type {
	ColumnType,
	TablePaginationConfig,
} from "antd/lib/table/interface";

import { PromiseCompleteCallback, asyncEventOverload } from "../utils/misc";

export type Column<T> = Pick<
	ColumnType<T>,
	"title" | "dataIndex" | "width" | "render" | "onCellClick"
>;

interface TableProps<T> {
	columns: Column<T>[];
	data: T[];
	initialPagination: Pick<
		TablePaginationConfig,
		"current" | "pageSize" | "total" | "pageSizeOptions"
	>;
	uniqueKey: string;
	onPaginate?:
		| ((page: number) => void)
		| {
				promise: (page: number) => Promise<any>;
				callback: PromiseCompleteCallback;
		  };
	onLimitChange?:
		| ((limit: number) => void)
		| {
				promise: (limit: number) => Promise<any>;
				callback: PromiseCompleteCallback;
		  };
}

export function Table<T extends Ark.AnyObject>(
	props: PropsWithChildren<TableProps<T>>
): JSX.Element {
	const {
		columns,
		data,
		initialPagination,
		uniqueKey,
		onPaginate,
		onLimitChange,
	} = props;

	const [loading, setLoading] = useState(false);

	const [pagination, setPagination] = useState<TablePaginationConfig>({
		...initialPagination,
		showQuickJumper: false,
		showSizeChanger: true,
	});

	return (
		<AntTable
			columns={columns}
			rowKey={(record) => record[uniqueKey]}
			dataSource={data}
			loading={loading}
			pagination={pagination}
			onChange={(newPagination) => {
				if (
					newPagination.current &&
					typeof newPagination.current !== undefined &&
					newPagination.current > -1 &&
					newPagination.current !== initialPagination.current &&
					onPaginate
				) {
					const newPage = newPagination.current;
					asyncEventOverload(setLoading, onPaginate, newPage).then(() => {
						setPagination((pagination) => ({
							...pagination,
							current: newPage,
						}));
					});
				} else if (
					newPagination.pageSize &&
					typeof newPagination.pageSize !== undefined &&
					newPagination.pageSize > -1 &&
					newPagination.pageSize !== initialPagination.pageSize &&
					onLimitChange
				) {
					const newLimit = newPagination.pageSize;
					asyncEventOverload(setLoading, onLimitChange, newLimit).then(() => {
						setPagination((pagination) => ({
							...pagination,
							pageSize: newLimit,
						}));
					});
				}
			}}
		/>
	);
}
