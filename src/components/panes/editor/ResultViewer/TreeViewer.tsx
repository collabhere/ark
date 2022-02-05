import React, { FC, useState } from "react";
import { Collapse, Dropdown, Input, Menu } from "antd";
import { ObjectID, ObjectId } from "bson";
import "./styles.less";
import "../../../../common/styles/layout.less";
import {
	CaretRightOutlined,
	SettingOutlined,
	PlaySquareFilled,
	CloseSquareFilled,
} from "@ant-design/icons";
import { useEffect } from "react";
import { useCallback } from "react";
import { Button } from "../../../../common/components/Button";

const { Panel } = Collapse;

interface BSONTest {
	type:
		| "oid"
		| "isodate"
		| "number"
		| "string"
		| "boolean"
		| "primitive[]"
		| "subdocument"
		| "subdocument[]"
		| "null"
		| "unknown";
}

const isBSONType = (value) =>
	value instanceof ObjectId ||
	value instanceof Date ||
	typeof value === "string" ||
	typeof value === "number" ||
	typeof value === "boolean" ||
	value === null;

const testBsonValue = (value: Ark.BSONTypes): BSONTest => ({
	type:
		value instanceof ObjectId
			? "oid"
			: value instanceof Date
			? "isodate"
			: typeof value === "string"
			? "string"
			: typeof value === "number"
			? "number"
			: typeof value === "boolean"
			? "boolean"
			: typeof value === "object" &&
			  Array.isArray(value) &&
			  isBSONType(value[0])
			? "primitive[]"
			: typeof value === "object" &&
			  Array.isArray(value) &&
			  !isBSONType(value[0])
			? "subdocument[]"
			: typeof value === "object" && value !== null
			? "subdocument"
			: value === null
			? "null"
			: "unknown",
});

interface ContentBuilderOptions {
	editable: boolean;
	onKeyChange?: (key: string | number, value: Ark.BSONTypes) => void;
}

interface ContentBuilderReducer {
	(
		rows: React.ReactNode[],
		entry: [string | number, Ark.BSONTypes | Ark.BSONDocument | Ark.BSONArray]
	);
}
interface ContentBuilder {
	(options: ContentBuilderOptions): ContentBuilderReducer;
}

const contentBuilder: ContentBuilder =
	({ editable, onKeyChange }: ContentBuilderOptions) =>
	(rows, [key, value]) => {
		const { type } = testBsonValue(value);
		// console.log("KEY", key, "TYPE", type, "VALUE", value);
		switch (type) {
			case "oid": {
				rows.push(
					<ObjectIdRow
						key={key}
						field={key}
						id={value as ObjectId}
						editable={editable}
					/>
				);
				break;
			}
			case "isodate": {
				rows.push(
					<ISODateRow
						key={key}
						field={key}
						date={value as Date}
						editable={editable}
					/>
				);
				break;
			}
			case "boolean": {
				rows.push(
					<BooleanValueRow
						key={key}
						field={key}
						value={value as boolean}
						editable={editable}
						onValueChange={(value) => {}}
					/>
				);
				break;
			}
			case "number": {
				rows.push(
					<NumberValueRow
						key={key}
						field={key}
						value={value as number}
						editable={editable}
					/>
				);
				break;
			}
			case "string": {
				rows.push(
					<StringValueRow
						key={key}
						field={key}
						value={value as string}
						editable={editable}
						onValueChange={(value) => onKeyChange && onKeyChange(key, value)}
					/>
				);
				break;
			}
			case "primitive[]": {
				const bsonTypes = value as Ark.BSONTypes[];
				rows.push(
					<div key={key}>
						<Collapse
							defaultActiveKey={["0"]}
							expandIcon={({ isActive }) => (
								<CaretRightOutlined rotate={isActive ? 90 : 0} />
							)}
						>
							<Panel key={key} header={key}>
								{bsonTypes
									.map<Parameters<ContentBuilderReducer>[1]>((t, i) => [i, t])
									.reduce(
										contentBuilder({
											editable,
											onKeyChange,
										}),
										[]
									)}
							</Panel>
						</Collapse>
					</div>
				);
				break;
			}
			case "subdocument[]": {
				const subdocumentArray = value as Ark.BSONArray;
				rows.push(
					<div key={key}>
						<Collapse
							defaultActiveKey={["0"]}
							expandIcon={({ isActive }) => (
								<CaretRightOutlined rotate={isActive ? 90 : 0} />
							)}
						>
							<Panel key={key} header={key}>
								<Collapse
									defaultActiveKey={["0"]}
									expandIcon={({ isActive }) => (
										<CaretRightOutlined rotate={isActive ? 90 : 0} />
									)}
								>
									{subdocumentArray.map((document, index) => (
										<DocumentPanel
											key={index}
											document={document}
											editable={editable}
											field={"(" + String(index + 1) + ")"}
											onDocumentModified={(subkey, value) =>
												onKeyChange &&
												onKeyChange(key + "." + index + "." + subkey, value)
											}
										/>
									))}
								</Collapse>
							</Panel>
						</Collapse>
					</div>
				);
				break;
			}
			case "subdocument": {
				const document = value as Ark.BSONDocument;
				rows.push(
					<Collapse
						key={key}
						defaultActiveKey={["0"]}
						expandIcon={({ isActive }) => (
							<CaretRightOutlined rotate={isActive ? 90 : 0} />
						)}
					>
						<DocumentPanel
							document={document}
							field={key}
							editable={editable}
							onDocumentModified={(subkey, value) =>
								onKeyChange && onKeyChange(key + "." + subkey, value)
							}
						/>
					</Collapse>
				);
				break;
			}
			case "null": {
				rows.push(
					<NullValueRow
						key={key}
						field={key}
						value={value as null}
						editable={editable}
						onValueChange={(value) => onKeyChange && onKeyChange(key, value)}
					/>
				);
				break;
			}
			case "unknown":
			default:
				rows.push(
					<div style={{ display: "flex" }} key={key}>
						<div style={{ width: "50%" }}>{key}</div>
						<div style={{ width: "50%" }}>{}</div>
					</div>
				);
		}

		return rows;
	};

interface CreateMenuItem {
	item: string;
	cb: () => void;
	danger?: boolean;
}
const createContextMenuItems = (items: CreateMenuItem[]) => (
	<Menu>
		{items.map((menuItem, i) => (
			<Menu.Item
				danger={menuItem.danger}
				key={i}
				onClick={(e) => (e.domEvent.stopPropagation(), menuItem.cb())}
			>
				<a>{menuItem.item}</a>
			</Menu.Item>
		))}
	</Menu>
);

interface DocumentOptionsProps {
	onDocumentDelete(): void;
	onCopyJSON(): void;
	onEditJSON(): void;
}

const DocumentOptions: FC<DocumentOptionsProps> = ({
	onCopyJSON,
	onDocumentDelete,
	onEditJSON,
}: DocumentOptionsProps) => (
	<Dropdown
		overlay={createContextMenuItems([
			{
				item: "Copy JSON",
				cb: onCopyJSON,
			},
			{
				item: "Edit JSON",
				cb: onEditJSON,
			},
			{
				item: "Delete Document",
				cb: onDocumentDelete,
				danger: true,
			},
		])}
		trigger={["click"]}
	>
		<Button
			icon={<SettingOutlined />}
			variant={"primary"}
			onClick={(e) => e.stopPropagation()}
		/>
	</Dropdown>
);

interface ObjectIdRowProps {
	field: string | number;
	id: ObjectId;
	editable: boolean;
}
const ObjectIdRow: FC<ObjectIdRowProps> = (props) => {
	const { field, id, editable } = props;
	return (
		<div style={{ display: "flex" }} key={field}>
			<div style={{ width: "50%" }}>{field}</div>
			<div style={{ width: "50%" }}>{`ObjectId("` + id.toString() + `")`}</div>
		</div>
	);
};

interface ISODateRowProps {
	field: string | number;
	date: Date;
	editable: boolean;
}
const ISODateRow: FC<ISODateRowProps> = (props) => {
	const { field, date, editable } = props;
	return (
		<div style={{ display: "flex" }} key={field}>
			<div style={{ width: "50%" }}>{field}</div>
			<div style={{ width: "50%" }}>
				{`ISODate("` + date.toISOString() + `")`}
			</div>
		</div>
	);
};

interface StringValueRowrops {
	field: string | number;
	value: string;
	editable: boolean;
	onValueChange: (value: string) => void;
}
const StringValueRow: FC<StringValueRowrops> = (props) => {
	const { field, value, editable, onValueChange } = props;
	const [editedValue, setEditedValue] = useState(value);
	return (
		<div style={{ display: "flex" }} key={field}>
			<div style={{ width: "50%" }}>{field}</div>
			<div style={{ width: "50%" }}>
				{editable ? (
					<Input
						value={editedValue}
						onChange={(e) =>
							setEditedValue((val) => ((val = e.target.value), val))
						}
						onPressEnter={(e) => onValueChange(e.currentTarget.value)}
					/>
				) : (
					String(value)
				)}
			</div>
		</div>
	);
};

interface NumberValueRowrops {
	field: string | number;
	value: number;
	editable: boolean;
}
const NumberValueRow: FC<NumberValueRowrops> = (props) => {
	const { field, value, editable } = props;
	return (
		<div style={{ display: "flex" }} key={field}>
			<div style={{ width: "50%" }}>{field}</div>
			<div style={{ width: "50%" }}>{String(value)}</div>
		</div>
	);
};

interface BooleanValueRowProps {
	field: string | number;
	value: boolean;
	editable: boolean;
	onValueChange: (value: boolean) => void;
}
const BooleanValueRow: FC<BooleanValueRowProps> = (props) => {
	const { field, value, editable, onValueChange } = props;

	return editable ? (
		<div></div>
	) : (
		<div style={{ display: "flex" }} key={field}>
			<div style={{ width: "50%" }}>{field}</div>
			<div style={{ width: "50%" }}>{String(value)}</div>
		</div>
	);
};

interface DocumentPanelProps {
	field: string | number;
	document: Ark.BSONDocument;
	editable?: boolean;
	allowOptions?: boolean;
	onDocumentModified?: (key: string, value: Ark.BSONTypes) => void;
	onDocumentEditComplete?: () => void;
	onDocumentEditCancel?: () => void;
}
const DocumentPanel: FC<DocumentPanelProps> = (props) => {
	const {
		field,
		document,
		allowOptions = false,
		editable = false,
		onDocumentModified,
		onDocumentEditComplete,
		onDocumentEditCancel,
	} = props;

	const [editing, setEditing] = useState(editable);

	useEffect(() => setEditing(editable), [editable]);

	return (
		<Collapse
			key={field}
			defaultActiveKey={["0"]}
			expandIcon={({ isActive }) => (
				<CaretRightOutlined rotate={isActive ? 90 : 0} />
			)}
		>
			<Panel
				header={
					field +
					(document && document._id
						? ` ObjectId("` + document._id.toString() + `")`
						: "")
				}
				key={field}
				extra={
					allowOptions && (
						<div style={{ display: "flex" }}>
							{allowOptions &&
								(editing ? (
									<Button
										variant="primary"
										size="small"
										icon={
											<PlaySquareFilled
												onClick={(e) => {
													e.stopPropagation();
													onDocumentEditComplete && onDocumentEditComplete();
													setEditing(false);
												}}
											/>
										}
									/>
								) : (
									<DocumentOptions
										onCopyJSON={() =>
											window.ark.copyText(JSON.stringify(document, null, 4))
										}
										onDocumentDelete={() => {}}
										onEditJSON={() => setEditing(true)}
									/>
								))}
							{allowOptions && editing && (
								<Button
									variant="primary"
									size="small"
									icon={
										<CloseSquareFilled
											onClick={(e) => {
												e.stopPropagation();
												onDocumentEditCancel && onDocumentEditCancel();
												setEditing(false);
											}}
										/>
									}
								/>
							)}
						</div>
					)
				}
			>
				{Object.entries(document).reduce<React.ReactNode[]>(
					contentBuilder({
						editable: editing,
						onKeyChange: (key, value) =>
							onDocumentModified && onDocumentModified(String(key), value),
					}),
					[]
				)}
			</Panel>
		</Collapse>
	);
};

interface NullValueRowProps {
	field: string | number;
	value: null;
	editable: boolean;
	onValueChange: (value: boolean) => void;
}
const NullValueRow: FC<NullValueRowProps> = (props) => {
	const { field, value, editable, onValueChange } = props;

	return editable ? (
		<div></div>
	) : (
		<div style={{ display: "flex" }} key={field}>
			<div style={{ width: "50%" }}>{field}</div>
			<div style={{ width: "50%" }}>{String(value)}</div>
		</div>
	);
};

interface JSONViewerProps {
	bson: Ark.BSONArray;
}

export const TreeViewer: FC<JSONViewerProps> = (props) => {
	const { bson } = props;

	const [updates, setUpdates] = useState<
		Array<{
			_id: string;
			update: Record<"$set", Record<string, Ark.BSONTypes>>;
		}>
	>([]);

	const clearUpdates = () => setUpdates([]);

	const onKeyUpdate = (id: string, key: string, value: Ark.BSONTypes) =>
		setUpdates((updates) => {
			const idx = updates.findIndex((u) => u._id === id);
			if (idx > -1) {
				updates[idx].update.$set[key] = value;
			} else {
				updates.push({
					_id: id,
					update: {
						$set: { [key]: value },
					},
				});
			}
			return Array.from(updates);
		});

	const removeDocumentUpdates = (id: string) =>
		setUpdates((updates) => {
			const idx = updates.findIndex((u) => u._id === id);
			if (idx > -1) {
				updates.splice(idx, 1);
				return Array.from(updates);
			} else {
				return updates;
			}
		});

	const updateDocument = useCallback(
		(documentId: string) => {
			console.log("Running update on", documentId, "with", updates);
		},
		[updates]
	);

	return (
		<>
			{bson && bson.length ? (
				<div className="TreeViewer">
					<div className="TreeViewHeader">Header</div>
					<div className="TreeViewerContent">
						{bson.map((document, index) => (
							<DocumentPanel
								allowOptions={
									!!(document._id && document._id instanceof ObjectId)
								}
								document={document}
								field={"(" + String(index + 1) + ")"}
								key={index}
								onDocumentModified={(key, value) =>
									onKeyUpdate(document._id.toString(), key, value)
								}
								onDocumentEditComplete={() => {
									updateDocument(document._id.toString());
								}}
								onDocumentEditCancel={() => {
									removeDocumentUpdates(document._id.toString());
								}}
							/>
						))}
					</div>
				</div>
			) : (
				<div></div>
			)}
		</>
	);
};
