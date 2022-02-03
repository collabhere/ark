import React, { FC, useState } from "react";
import { Collapse, Dropdown, Input, Menu } from "antd";
import { ObjectID, ObjectId } from "bson";
import "../../styles.less";
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
		| "subdocument"
		| "subdocument[]"
		| "unknown";
}

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
			: typeof value === "object" && Array.isArray(value)
			? "subdocument[]"
			: typeof value === "object"
			? "subdocument"
			: "unknown",
});

interface ContentBuilderOptions {
	editable: boolean;
	onKeyChange?: (key: string, value: Ark.BSONTypes) => void;
}

const contentBuilder = (
	document: Ark.BSONDocument,
	{ editable, onKeyChange }: ContentBuilderOptions
) =>
	Object.entries(document).reduce<React.ReactNode[]>((rows, [key, value]) => {
		const { type } = testBsonValue(value);
		switch (type) {
			case "subdocument[]": {
				const subdocumentArray = value as Ark.BSONArray;
				rows.push(
					<div>
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
						defaultActiveKey={["0"]}
						expandIcon={({ isActive }) => (
							<CaretRightOutlined rotate={isActive ? 90 : 0} />
						)}
					>
						<DocumentPanel
							key={rows.length - 1}
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
			case "oid": {
				rows.push(
					<ObjectIdRow field={key} id={value as ObjectId} editable={editable} />
				);
				break;
			}
			case "isodate": {
				rows.push(
					<ISODateRow field={key} date={value as Date} editable={editable} />
				);
				break;
			}
			case "boolean": {
				rows.push(
					<BooleanValueRow
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
						field={key}
						value={value as string}
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
	}, []);

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
	field: string;
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
	field: string;
	date: Date;
	editable: boolean;
}
const ISODateRow: FC<ISODateRowProps> = (props) => {
	const { field, date, editable } = props;
	return (
		<div style={{ display: "flex" }} key={field}>
			<div style={{ width: "50%" }}>{field}</div>
			<div style={{ width: "50%" }}>{`ISODate("` + date.toString() + `")`}</div>
		</div>
	);
};

interface StringValueRowrops {
	field: string;
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
	field: string;
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
	field: string;
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
				{contentBuilder(document, {
					editable: editing,
					onKeyChange: onDocumentModified,
				})}
			</Panel>
		</Collapse>
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
			// console.log("Running update on", documentId, "with", updates);
		},
		[updates]
	);

	// console.log("UPDATES", updates);

	return (
		<>
			{bson && bson.length ? (
				<div className="TreeViewer">
					<div>Header</div>
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
			) : (
				<div></div>
			)}
		</>
	);
};
