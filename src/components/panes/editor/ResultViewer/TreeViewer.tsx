import "./styles.less";
import "../../../../common/styles/layout.less";

import React, { FC, useState } from "react";
import { ObjectId } from "bson";
import { useCallback } from "react";
import {
	CollapseContent,
	CollapseList,
} from "../../../../common/components/CollapseList";
import {
	IconName,
	MenuDivider,
	MenuItem,
	Menu,
	Intent,
	InputGroup,
} from "@blueprintjs/core";
import { ContextMenu2 } from "@blueprintjs/popover2";
import { Button } from "../../../../common/components/Button";
import { DangerousActionPrompt } from "../../../dialogs/DangerousActionPrompt";

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

enum ContentRowActions {
	copy_key = "copy_key",
	copy_value = "copy_value",
	edit_document = "edit_document",
	delete_document = "delete_document",
}

interface ContentRowProps {
	onContextMenuAction(action: ContentRowActions): void;
}

const ContentRow: FC<ContentRowProps> = (props) => {
	const { children, onContextMenuAction } = props;
	return (
		<ContextMenu2
			content={createContextMenuItems([
				{
					item: "Copy",
					key: "copy",
					intent: "primary",
					icon: "comparison",
					submenu: [
						{
							key: ContentRowActions.copy_key,
							item: "Key",
							cb: () => onContextMenuAction(ContentRowActions.copy_key),
						},
						{
							key: ContentRowActions.copy_value,
							item: "Value",
							cb: () => onContextMenuAction(ContentRowActions.copy_value),
						},
					],
				},
				{
					item: "Edit Document",
					key: ContentRowActions.edit_document,
					cb: () => onContextMenuAction(ContentRowActions.edit_document),
					intent: "primary",
					icon: "edit",
				},
				{
					divider: true,
					key: "div_1",
				},
				{
					item: "Delete Document",
					key: ContentRowActions.delete_document,
					cb: () => onContextMenuAction(ContentRowActions.delete_document),
					icon: "trash",
					intent: "danger",
				},
			])}
		>
			<div className={"content-row"}>{children}</div>
		</ContextMenu2>
	);
};

interface ContentBuilderOptions {
	document: Ark.BSONDocument | Ark.BSONArray | Ark.BSONTypes[];
	editable: boolean;
	onChange(
		changed: "value" | "key",
		oldKey: string,
		oldValue: Ark.BSONTypes,
		newKey: string,
		newValue: Ark.BSONTypes
	): void;
	onRowAction: (
		action: ContentRowActions,
		key: string | number,
		value: Ark.BSONTypes
	) => void;
}

interface ContentBuilder {
	(options: ContentBuilderOptions): React.ReactNode[];
}

const contentBuilder: ContentBuilder = (
	contentBuilderOptions: ContentBuilderOptions
) => {
	const { document, editable, onChange, onRowAction } = contentBuilderOptions;
	return Object.entries(document).reduce<React.ReactNode[]>(
		(rows, [key, value], rowIdx) => {
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
							onAction={onRowAction}
							onValueChange={() => {}}
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
							onAction={onRowAction}
							onValueChange={() => {}}
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
							onAction={onRowAction}
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
							onAction={onRowAction}
							onValueChange={() => {}}
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
							onChange={(change, newKey, newValue) =>
								onChange && onChange(change, key, value, newKey, newValue)
							}
							onAction={onRowAction}
						/>
					);
					break;
				}
				case "primitive[]": {
					const bsonTypes = value as Ark.BSONTypes[];
					rows.push(
						<CollapseList
							content={[
								{
									jsx: (
										<div key={key}>
											{contentBuilder({
												...contentBuilderOptions,
												document: bsonTypes,
												onRowAction: (action, key) =>
													onRowAction(action, key, bsonTypes),
											})}
										</div>
									),
									header: {
										primary: true,
										key: String(key),
										title: String(key),
									},
								},
							]}
						/>
					);
					break;
				}
				case "subdocument[]": {
					const subdocumentArray = value as Ark.BSONArray;
					rows.push(
						<CollapseList
							key={key}
							content={[
								{
									jsx: (
										<CollapseList
											content={subdocumentArray.map((document, index) => ({
												jsx: (
													<div>
														{contentBuilder({
															...contentBuilderOptions,
															document: subdocumentArray,
															onRowAction: (action, key) =>
																onRowAction(action, key, subdocumentArray),
														})}
													</div>
												),
												header: {
													primary: true,
													key: String(index),
													title: "(" + String(index + 1) + ")",
												},
											}))}
										/>
									),
									header: {
										primary: true,
										key: String(),
										title: String(key),
									},
								},
							]}
						/>
					);
					break;
				}
				case "subdocument": {
					const document = value as Ark.BSONDocument;
					rows.push(
						<CollapseList
							content={[
								{
									jsx: (
										<div>
											{contentBuilder({
												...contentBuilderOptions,
												document,
												onRowAction: (action, key) =>
													onRowAction(action, key, document),
											})}
										</div>
									),
									header: {
										primary: true,
										key: String(),
										title: String(key),
									},
								},
							]}
						/>
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
							onValueChange={(value) => {}}
							onAction={onRowAction}
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
		},
		[]
	);
};

interface CreateMenuItem {
	item?: string;
	key?: string;
	cb?: (key?: string) => void;
	icon?: IconName;
	intent?: Intent;
	divider?: boolean;
	submenu?: CreateMenuItem[];
}
const createContextMenuItems = (items: CreateMenuItem[]) => (
	<Menu>
		{items.map((menuItem) =>
			menuItem.divider ? (
				<MenuDivider />
			) : menuItem.submenu ? (
				<MenuItem
					intent={menuItem.intent}
					icon={menuItem.icon}
					key={menuItem.key}
					text={menuItem.item}
					onClick={() => menuItem.cb && menuItem.cb(menuItem.key)}
				>
					{createContextMenuItems(menuItem.submenu)}
				</MenuItem>
			) : (
				<MenuItem
					intent={menuItem.intent}
					icon={menuItem.icon}
					key={menuItem.key}
					text={menuItem.item}
					onClick={() => menuItem.cb && menuItem.cb(menuItem.key)}
				/>
			)
		)}
	</Menu>
);

interface ObjectIdRowProps {
	field: string | number;
	id: ObjectId;
	editable: boolean;
	onValueChange: (value: ObjectId) => void;
	onAction: (
		action: ContentRowActions,
		key: string | number,
		value: ObjectId
	) => void;
}
const ObjectIdRow: FC<ObjectIdRowProps> = (props) => {
	const { field, id, editable, onValueChange, onAction } = props;
	return (
		<ContentRow
			onContextMenuAction={(action) => onAction(action, field, id)}
			key={field}
		>
			<div style={{ width: "50%" }}>{field}</div>
			<div style={{ width: "50%" }}>{`ObjectId("` + id.toString() + `")`}</div>
		</ContentRow>
	);
};

interface ISODateRowProps {
	field: string | number;
	date: Date;
	editable: boolean;
	onValueChange: (value: Date) => void;
	onAction: (
		action: ContentRowActions,
		key: string | number,
		value: Date
	) => void;
}
const ISODateRow: FC<ISODateRowProps> = (props) => {
	const { field, date, editable, onValueChange, onAction } = props;
	return (
		<ContentRow
			onContextMenuAction={(action) => onAction(action, field, date)}
			key={field}
		>
			<div style={{ width: "50%" }}>{field}</div>
			<div style={{ width: "50%" }}>
				{`ISODate("` + date.toISOString() + `")`}
			</div>
		</ContentRow>
	);
};

interface StringValueRowrops {
	field: string | number;
	value: string;
	editable: boolean;
	onChange: (change: "key" | "value", key: string, value: string) => void;
	onAction: (
		action: ContentRowActions,
		key: string | number,
		value: string
	) => void;
}
const StringValueRow: FC<StringValueRowrops> = (props) => {
	const { field, value, editable, onChange, onAction } = props;

	const [editedField, setEditedField] = useState(String(field));
	const [editedValue, setEditedValue] = useState(value);

	return (
		<ContentRow
			onContextMenuAction={(action) => onAction(action, field, value)}
			key={field}
		>
			<div className="left">
				{editable ? (
					<InputGroup
						value={editedField}
						onChange={(e) =>
							setEditedField((val) => ((val = e.target.value), val))
						}
						onKeyPress={(e) =>
							e.key === "Enter"
								? onChange("key", e.currentTarget.value, editedValue)
								: undefined
						}
					/>
				) : (
					field
				)}
			</div>
			<div className="right">
				{editable ? (
					<InputGroup
						value={editedValue}
						onChange={(e) =>
							setEditedValue((val) => ((val = e.target.value), val))
						}
						onKeyPress={(e) =>
							e.key === "Enter"
								? onChange("value", editedField, e.currentTarget.value)
								: undefined
						}
					/>
				) : (
					String(value)
				)}
			</div>
		</ContentRow>
	);
};

interface NumberValueRowrops {
	field: string | number;
	value: number;
	editable: boolean;
	onValueChange: (value: number) => void;
	onAction: (
		action: ContentRowActions,
		key: string | number,
		value: number
	) => void;
}
const NumberValueRow: FC<NumberValueRowrops> = (props) => {
	const { field, value, editable, onValueChange, onAction } = props;
	return (
		<ContentRow
			onContextMenuAction={(action) => {
				onAction(action, field, value);
			}}
			key={field}
		>
			<div style={{ width: "50%" }}>{field}</div>
			<div style={{ width: "50%" }}>{String(value)}</div>
		</ContentRow>
	);
};

interface BooleanValueRowProps {
	field: string | number;
	value: boolean;
	editable: boolean;
	onValueChange: (value: boolean) => void;
	onAction: (
		action: ContentRowActions,
		key: string | number,
		value: boolean
	) => void;
}
const BooleanValueRow: FC<BooleanValueRowProps> = (props) => {
	const { field, value, editable, onValueChange, onAction } = props;

	return editable ? (
		<div></div>
	) : (
		<ContentRow
			onContextMenuAction={(action) => {
				onAction(action, field, value);
			}}
			key={field}
		>
			<div style={{ width: "50%" }}>{field}</div>
			<div style={{ width: "50%" }}>{String(value)}</div>
		</ContentRow>
	);
};

interface NullValueRowProps {
	field: string | number;
	value: null;
	editable: boolean;
	onValueChange: (value: null) => void;
	onAction: (
		action: ContentRowActions,
		key: string | number,
		value: null
	) => void;
}
const NullValueRow: FC<NullValueRowProps> = (props) => {
	const { field, value, editable, onValueChange, onAction } = props;

	return editable ? (
		<div></div>
	) : (
		<ContentRow
			onContextMenuAction={(action) => {
				onAction(action, field, value);
			}}
			key={field}
		>
			<div style={{ width: "50%" }}>{field}</div>
			<div style={{ width: "50%" }}>{String(value)}</div>
		</ContentRow>
	);
};

interface DocumentPanelProps {
	document: Ark.BSONDocument | Ark.BSONTypes[];
	editable: boolean;
	onDocumentModified: ContentBuilderOptions["onChange"];
	onDocumentEdit: () => void;
	onDocumentDelete: () => void;
}
const DocumentPanel: FC<DocumentPanelProps> = (props) => {
	const {
		document,
		editable = false,
		onDocumentModified,
		onDocumentEdit,
		onDocumentDelete,
	} = props;

	const onRowAction = useCallback(
		(action: ContentRowActions, key: string, value: Ark.BSONTypes) => {
			console.log(`[onRowAction] action=${action} key=${key} value=${value}`);
			switch (action) {
				case ContentRowActions.copy_key: {
					window.ark.copyText(key);
					break;
				}
				case ContentRowActions.copy_value: {
					window.ark.copyText(value?.toString() || "");
					break;
				}
				case ContentRowActions.edit_document: {
					onDocumentEdit();
					break;
				}
				case ContentRowActions.delete_document: {
					onDocumentDelete();
					break;
				}
			}
		},
		[onDocumentEdit, onDocumentDelete]
	);

	return (
		<>
			{contentBuilder({
				document,
				editable,
				onChange: onDocumentModified,
				onRowAction: (action, key, value) =>
					onRowAction(action, String(key), value),
			})}
		</>
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
	const [docsBeingEdited, setDocsBeingUpdated] = useState<
		Set<Ark.BSONDocument>
	>(new Set());
	const [docBeingDeleted, setDocBeingDeleted] = useState<Ark.BSONDocument>();

	const startEditingDocument = useCallback((document: Ark.BSONDocument) => {
		setDocsBeingUpdated((docs) => {
			if (!docs.has(document)) {
				docs.add(document);
				return new Set(docs);
			}
			return docs;
		});
	}, []);

	const stopEditingDocument = useCallback((document: Ark.BSONDocument) => {
		setDocsBeingUpdated((docs) => {
			if (docs.has(document)) {
				docs.delete(document);
				return new Set(docs);
			}
			return docs;
		});
	}, []);

	const clearUpdates = () => setUpdates([]);

	const setKeyValue = (id: string, key: string, value: Ark.BSONTypes) =>
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

	const onExistingKeyUpdate = (id: string, key: string, value: Ark.BSONTypes) =>
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

	const removeDocumentUpdates = useCallback(
		(id: string) =>
			setUpdates((updates) => {
				const idx = updates.findIndex((u) => u._id === id);
				if (idx > -1) {
					updates.splice(idx, 1);
					return Array.from(updates);
				} else {
					return updates;
				}
			}),
		[]
	);

	const updateDocument = useCallback(
		(documentId: string) => {
			console.log("Running update on", documentId, "with", updates);
		},
		[updates]
	);

	const createDocumentPanelListContent = useCallback(
		(document, index): CollapseContent => {
			return {
				jsx: (
					<DocumentPanel
						editable={docsBeingEdited.has(document)}
						document={document}
						key={index}
						onDocumentModified={(
							change,
							oldKey,
							oldValue,
							newKey,
							newValue
						) => {
							if (change === "value") {
								if (newValue !== oldValue)
									setKeyValue(document._id.toString(), oldKey, oldValue);
							}
						}}
						onDocumentEdit={() => startEditingDocument(document)}
						onDocumentDelete={() => setDocBeingDeleted(document)}
					/>
				),
				header: {
					menu: createContextMenuItems([
						{
							item: "Copy JSON",
							cb: () => window.ark.copyText(JSON.stringify(document, null, 4)),
							intent: "primary",
							icon: "comparison",
						},
						{
							item: "Edit Document",
							cb: () => {
								startEditingDocument(document);
							},
							intent: "primary",
							icon: "edit",
						},
						{
							divider: true,
						},
						{
							item: "Delete Document",
							cb: () => setDocBeingDeleted(document),
							icon: "trash",
							intent: "danger",
						},
					]),
					primary: true,
					key: String(index),
					title: `(${String(
						index + 1
					)}) ObjectId("${document._id.toString()}")`,
					rightElement: docsBeingEdited.has(document) ? (
						<div className="document-header-buttons">
							<Button
								size="small"
								text={"Save"}
								variant={"link"}
								onClick={(e) => {
									e.stopPropagation();
									updateDocument(document._id.toString());
									stopEditingDocument(document);
								}}
							/>
							<Button
								size="small"
								text={"Cancel"}
								variant={"link"}
								onClick={(e) => {
									e.stopPropagation();
									removeDocumentUpdates(document._id.toString());
									stopEditingDocument(document);
								}}
							/>
						</div>
					) : (
						<div></div>
					),
				},
			};
		},
		[
			docsBeingEdited,
			startEditingDocument,
			updateDocument,
			removeDocumentUpdates,
			stopEditingDocument,
		]
	);

	return (
		<div className="tree-viewer">
			<div className="header">Header</div>
			<div className="content">
				<CollapseList
					content={
						bson && bson.length ? bson.map(createDocumentPanelListContent) : []
					}
				/>
			</div>
			{/* Dialogs */}
			<>
				{docBeingDeleted && (
					<DangerousActionPrompt
						dangerousAction={() => Promise.resolve()}
						dangerousActionCallback={() => {}}
						onCancel={() => {
							setDocBeingDeleted(undefined);
						}}
						prompt={
							<>
								<p>{"Are you sure you would like to delete this document?"}</p>
								<p>{"Object ID - " + docBeingDeleted._id.toString()}</p>
							</>
						}
						title={"Deleting Document"}
					/>
				)}
			</>
		</div>
	);
};
