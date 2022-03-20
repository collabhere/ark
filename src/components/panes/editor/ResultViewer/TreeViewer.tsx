import "./styles.less";
import "../../../../common/styles/layout.less";

import React, { FC, useState, useEffect } from "react";
import { ObjectId, serialize, deserialize } from "bson";
import { useCallback } from "react";
import {
	CollapseContent,
	CollapseList,
} from "../../../../common/components/CollapseList";
import {
	Icon,
	IconName,
	MenuDivider,
	MenuItem,
	Menu,
	Intent,
	InputGroup,
	NumericInput,
	IconSize,
} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { ContextMenu2 } from "@blueprintjs/popover2";
import { DateInput } from "@blueprintjs/datetime";
import { Button } from "../../../../common/components/Button";
import { DangerousActionPrompt } from "../../../dialogs/DangerousActionPrompt";
import { handleErrors, notify } from "../../../../common/utils/misc";

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

interface SwitchableInputProps {
	onCommit: (key: string, value: Ark.BSONTypes) => void;
	onChange?: (key: string, value: Ark.BSONTypes) => void;
	onAction?: (action: ContentRowActions) => void;
	onKeyRemove?: (key: string) => void;
	initialType: "text" | "date" | "number" | "boolean" | "oid";
	field: string;
	value: string | Date | number | boolean | ObjectId | null;
	editable?: boolean;
	editableKey?: boolean;
	disableContextMenu?: boolean;
}

const SwitchableInput: FC<SwitchableInputProps> = (props) => {
	const {
		onAction,
		onCommit,
		onKeyRemove,
		onChange,
		initialType,
		field,
		value,
		editable,
		editableKey,
		disableContextMenu,
	} = props;

	const [type, setType] = useState(initialType);
	const [editedKey, setEditedKey] = useState(field);
	const [editedValue, setEditedValue] = useState(value);
	const [commited, setCommited] = useState(false);

	const isModified = value !== editedValue;

	const commitRow = (value?: SwitchableInputProps["value"]) => {
		if (isModified) {
			typeof value !== "undefined" && setEditedValue(value);
			onCommit(editedKey, value || editedValue);
			setCommited(true);
		}
	};

	const onValueChange = (value: SwitchableInputProps["value"]) => {
		setEditedValue(value);
		onChange && onChange(editedKey, value);
	};

	const wrap = (input: React.ReactNode) => {
		return (
			<div className="switchable-input">
				{!commited && editable && (
					<Select<SwitchableInputProps["initialType"]>
						items={["boolean", "date", "number", "oid", "text"]}
						itemRenderer={(item, { handleClick }) => (
							<MenuItem key={item} onClick={handleClick} text={String(item)} />
						)}
						onItemSelect={(item) => {
							setType(item);
						}}
						filterable={false}
						popoverProps={{
							position: "left",
						}}
					>
						<Icon icon="refresh" size={IconSize.STANDARD} />
					</Select>
				)}
				<div className="switchable-input-child">{input}</div>
				{!commited && editable && (
					<div className="button-container">
						{isModified && (
							<div className="button">
								<Button
									onClick={() => {
										commitRow();
									}}
									size={"small"}
									icon="small-tick"
									variant={"link"}
								/>
							</div>
						)}
						<div className="button">
							<Button
								onClick={() => onKeyRemove && onKeyRemove(field)}
								size={"small"}
								icon="delete"
								variant="link"
							/>
						</div>
					</div>
				)}
			</div>
		);
	};

	let jsx;

	switch (type) {
		case "text": {
			const input = (editedValue || "") as string;
			jsx = wrap(
				!commited && editable ? (
					<InputGroup
						small
						defaultValue={input.toString()}
						onChange={(e) => onValueChange(e.currentTarget.value)}
						onKeyPress={(e) => (e.key === "Enter" ? commitRow() : undefined)}
					/>
				) : (
					String(input)
				)
			);
			break;
		}
		case "oid": {
			const input = (editedValue || new ObjectId()) as string;
			jsx = wrap(
				!commited && editable ? (
					<div className="object-id">
						<span>{'ObjectId("'}</span>
						<InputGroup
							small
							defaultValue={input.toString()}
							onChange={(e) =>
								onValueChange(new ObjectId(e.currentTarget.value))
							}
							onKeyPress={(e) => (e.key === "Enter" ? commitRow() : undefined)}
						/>
						<span>{'")'}</span>
					</div>
				) : (
					`ObjectId("` + input.toString() + `")`
				)
			);
			break;
		}
		case "date": {
			const date = (editedValue || new Date()) as Date;
			jsx = wrap(
				!commited && editable ? (
					<DateInput
						shortcuts
						parseDate={(str) => new Date(str)}
						formatDate={(date) => date.toISOString()}
						onChange={(date, isUserChange) =>
							isUserChange && onValueChange(date)
						}
						defaultValue={date instanceof Date ? date : new Date()}
						timePrecision="millisecond"
					/>
				) : (
					<div className="right">{`ISODate("` + date.toISOString() + `")`}</div>
				)
			);
			break;
		}
		case "number": {
			const num = (editedValue || 0) as number;
			jsx = wrap(
				!commited && editable ? (
					<NumericInput
						onValueChange={(value) => onValueChange(value)}
						onKeyPress={(e) => (e.key === "Enter" ? commitRow() : undefined)}
						defaultValue={typeof num === "number" ? num : 0}
					/>
				) : (
					String(num)
				)
			);
			break;
		}
		case "boolean": {
			const bool = !!editedValue as boolean;
			jsx = wrap(
				!commited && editable ? (
					<Select<boolean>
						items={[true, false]}
						itemRenderer={(item, { handleClick }) => (
							<MenuItem
								key={String(item)}
								onClick={handleClick}
								text={String(item)}
							/>
						)}
						onItemSelect={(item) => {
							onValueChange(item);
						}}
						activeItem={bool}
						filterable={false}
					>
						<Button rightIcon="caret-down" text={String(bool)} />
					</Select>
				) : (
					String(bool)
				)
			);
			break;
		}
		default: {
			jsx = <></>;
			break;
		}
	}

	const keyInput = (
		<InputGroup
			small
			defaultValue={editedKey}
			onChange={(e) =>
				setEditedKey(
					(e as unknown as React.ChangeEvent<HTMLInputElement>).currentTarget
						.value
				)
			}
			onKeyPress={(e) => (e.key === "Enter" ? commitRow() : undefined)}
		/>
	);

	return (
		<ContentRow
			onContextMenuAction={(action) => onAction && onAction(action)}
			key={field}
			disableContextMenu={disableContextMenu}
		>
			<div className="left">{editableKey ? keyInput : field}</div>
			<div className="modified">
				{isModified && editable && (
					<Icon icon="symbol-circle" size={IconSize.STANDARD} />
				)}
			</div>
			<div className="right">{jsx}</div>
		</ContentRow>
	);
};

enum ContentRowActions {
	copy_json = "copy_json",
	copy_key = "copy_key",
	copy_value = "copy_value",
	edit_document = "edit_document",
	discard_edit = "discard_edit",
	delete_document = "delete_document",
}

interface ContentRowProps {
	onContextMenuAction?: (action: ContentRowActions) => void;
	disableContextMenu?: boolean;
}

const ContentRow: FC<ContentRowProps> = (props) => {
	const {
		children,
		onContextMenuAction = () => {},
		disableContextMenu,
	} = props;

	return disableContextMenu ? (
		<div onContextMenu={(e) => e.stopPropagation()} className={"content-row"}>
			{children}
		</div>
	) : (
		<ContextMenu2
			className="context-menu"
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
		changed: "value" | "new_key",
		key: string,
		value: Ark.BSONTypes
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

	const onValueChange = (key: string, newValue: Ark.BSONTypes) =>
		onChange && onChange("value", key, newValue);

	const rows = Object.entries(document).reduce<React.ReactNode[]>(
		(rows, [key, value], rowIdx) => {
			const { type } = testBsonValue(value);
			// console.log("KEY", key, "TYPE", type, "VALUE", value);
			switch (type) {
				case "oid": {
					rows.push(
						<SwitchableInput
							key={key + "_idx_" + rowIdx}
							initialType={type}
							field={key}
							value={value as ObjectId}
							editable={editable}
							onAction={(action) => onRowAction(action, key, value)}
							onCommit={onValueChange}
						/>
					);
					break;
				}
				case "isodate": {
					rows.push(
						<SwitchableInput
							key={key + "_idx_" + rowIdx}
							initialType={"date"}
							field={key}
							value={value as Date}
							editable={editable}
							onAction={(action) => onRowAction(action, key, value)}
							onCommit={onValueChange}
						/>
					);
					break;
				}
				case "number": {
					rows.push(
						<SwitchableInput
							key={key + "_idx_" + rowIdx}
							initialType={type}
							field={key}
							value={value as number}
							editable={editable}
							onAction={(action) => onRowAction(action, key, value)}
							onCommit={onValueChange}
						/>
					);
					break;
				}
				case "boolean": {
					rows.push(
						<SwitchableInput
							key={key + "_idx_" + rowIdx}
							initialType={type}
							field={key}
							value={value as boolean}
							editable={editable}
							onAction={(action) => onRowAction(action, key, value)}
							onCommit={onValueChange}
						/>
					);
					break;
				}
				case "null":
				case "string": {
					rows.push(
						<SwitchableInput
							key={key + "_idx_" + rowIdx}
							initialType={"text"}
							field={key}
							value={String(value) as string}
							editable={editable}
							onAction={(action) => onRowAction(action, key, value)}
							onCommit={onValueChange}
						/>
					);
					break;
				}
				case "primitive[]": {
					const bsonTypes = value as Ark.BSONTypes[];
					rows.push(
						<CollapseList
							key={key}
							content={[
								{
									jsx: (
										<div>
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
															document: document,
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
										key: String(key),
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
							key={key + "_idx_" + rowIdx}
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
										key: String(key),
										title: String(key),
									},
								},
							]}
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

	if (editable) {
		rows.push(<NewFieldRows key={rows.length} onChange={onValueChange} />);
	}

	return rows;
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
		{items.map((menuItem, idx) =>
			menuItem.divider ? (
				<MenuDivider key={menuItem.key + "_idx_" + idx} />
			) : menuItem.submenu ? (
				<MenuItem
					intent={menuItem.intent}
					icon={menuItem.icon}
					key={menuItem.key + "_idx_" + idx}
					text={menuItem.item}
					onClick={() => menuItem.cb && menuItem.cb(menuItem.key)}
				>
					{createContextMenuItems(menuItem.submenu)}
				</MenuItem>
			) : (
				<MenuItem
					intent={menuItem.intent}
					icon={menuItem.icon}
					key={menuItem.key + "_idx_" + idx}
					text={menuItem.item}
					onClick={() => menuItem.cb && menuItem.cb(menuItem.key)}
				/>
			)
		)}
	</Menu>
);

interface NewFieldRowsProps {
	onChange?: (key: string, value: Ark.BSONTypes) => void;
}
const NewFieldRows: FC<NewFieldRowsProps> = (props) => {
	const { onChange } = props;

	const [rows, setRows] = useState<
		{ key: string; value: Ark.BSONTypes; commited?: boolean }[]
	>([]);
	const [addingKeys, setAddingKeys] = useState<boolean>(false);

	console.log("rows", rows);

	useEffect(() => {
		if (rows.length === 0) setAddingKeys(false);
		else if (rows.length > 0 && !addingKeys) setAddingKeys(true);
	}, [addingKeys, rows.length]);

	const setKeyValue = (idx, key, value) => {
		setRows((fields) => {
			if (typeof fields[idx] === "undefined")
				fields[idx] = { key: "", value: "" };
			fields[idx].key = key;
			fields[idx].value = value;
			return [...fields];
		});
	};

	const addField = () => {
		setRows((fields) => {
			fields.push({ key: "", value: "" });
			return [...fields];
		});
	};

	const removeKeyValue = (idx) => {
		setRows((fields) => {
			fields.splice(idx, 1);
			return [...fields];
		});
	};

	const commitRow = (idx: number) => {
		console.log("Commiting", idx);
		setRows((fields) => {
			fields[idx].commited = true;
			return [...fields];
		});
		onChange && onChange(rows[idx].key, rows[idx].value);
	};

	return (
		<>
			{addingKeys && rows.length ? (
				rows.map((field, idx) => (
					<>
						<div className="new-field-row" key={idx}>
							<SwitchableInput
								key={idx}
								onCommit={(key, value) => {
									setKeyValue(idx, key, value);
									commitRow(idx);
								}}
								onKeyRemove={() => {
									removeKeyValue(idx);
								}}
								initialType="text"
								field={field.key}
								value={field.value as string}
								editable={!field.commited}
								editableKey={!field.commited}
								disableContextMenu
							/>
						</div>
						{rows.length - 1 === idx && (
							<Button
								onClick={() => {
									addField();
								}}
								size={"small"}
								icon="small-plus"
								text="Add more"
								variant={"primary"}
							/>
						)}
					</>
				))
			) : (
				<div>
					<Button
						onClick={() => {
							addField();
						}}
						size={"small"}
						icon="small-plus"
						variant={"primary"}
						text={"Add new fields"}
					/>
				</div>
			)}
		</>
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
	driverConnectionId: string;
	shellConfig: Ark.ShellConfig;
	onRefresh: () => void;
}

export const TreeViewer: FC<JSONViewerProps> = (props) => {
	const {
		bson: bsonResult,
		driverConnectionId,
		shellConfig,
		onRefresh,
	} = props;

	const [bson, setBSON] = useState(bsonResult);
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
	const [refreshCounts, setRefreshCounts] = useState({});

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

	const refreshDocument = useCallback((document: Ark.BSONDocument) => {
		setRefreshCounts((counts) => {
			counts[document._id.toString()] =
				(counts[document._id.toString()] || 0) + 1;
			return { ...counts };
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
			const current = updates.find((update) => update._id === documentId);

			if (current && shellConfig.database) {
				return window.ark.driver
					.run("query", "updateOne", {
						id: driverConnectionId,
						collection: shellConfig.collection,
						database: shellConfig.database,
						query: serialize({
							_id: new ObjectId(current._id),
						}),
						update: serialize(current.update),
					})
					.then((result) => {
						removeDocumentUpdates(documentId);
						onRefresh();
						if (result.ack) {
							notify({
								title: "Update",
								description: "Document updated succesfully",
								type: "success",
							});
						} else {
							console.log(result);
							notify({
								title: "Update",
								description: "Document update failed",
								type: "error",
							});
						}
					})
					.catch((err) => {
						removeDocumentUpdates(documentId);
						handleErrors(err, driverConnectionId);
					});
			} else {
				console.log("no update found for", documentId);
				return Promise.resolve();
			}
		},
		[
			driverConnectionId,
			onRefresh,
			removeDocumentUpdates,
			shellConfig.collection,
			shellConfig.database,
			updates,
		]
	);

	const documentContextMenu = useCallback(
		(document: any) => {
			const items: CreateMenuItem[] = [
				{
					item: "Copy JSON",
					cb: () => window.ark.copyText(JSON.stringify(document, null, 4)),
					intent: "primary",
					icon: "comparison",
					key: ContentRowActions.copy_json,
				},
				{
					divider: true,
					key: "div_2",
				},
				{
					item: "Delete Document",
					cb: () => setDocBeingDeleted(document),
					icon: "trash",
					intent: "danger",
					key: ContentRowActions.delete_document,
				},
			];

			items.splice(
				1,
				0,
				docsBeingEdited.has(document)
					? {
							item: "Discard Edits",
							cb: () => {
								stopEditingDocument(document);
							},
							intent: "primary",
							icon: "cross",
							key: ContentRowActions.discard_edit,
					  }
					: {
							item: "Edit Document",
							cb: () => {
								startEditingDocument(document);
							},
							intent: "primary",
							icon: "edit",
							key: ContentRowActions.edit_document,
					  }
			);

			return createContextMenuItems(items);
		},
		[docsBeingEdited, startEditingDocument, stopEditingDocument]
	);

	const createDocumentPanelListContent = useCallback(
		(document, index): CollapseContent => {
			return {
				jsx: (
					<DocumentPanel
						editable={docsBeingEdited.has(document)}
						document={document}
						key={(refreshCounts[document._id] || 0) + "" + index}
						onDocumentModified={(change, key, value) => {
							if (change === "value") {
								setKeyValue(document._id.toString(), key, value);
							}
						}}
						onDocumentEdit={() => startEditingDocument(document)}
						onDocumentDelete={() => setDocBeingDeleted(document)}
					/>
				),
				header: {
					menu: documentContextMenu(document),
					primary: true,
					key: index,
					title: `(${String(
						index + 1
					)}) ObjectId("${document._id.toString()}")`,
					rightElement: docsBeingEdited.has(document) ? (
						<div className="document-header-buttons">
							<Button
								size="small"
								text={"Save"}
								variant={"link"}
								onClick={{
									callback: () => {
										stopEditingDocument(document);
									},
									promise: (e) => {
										e.stopPropagation();
										return updateDocument(document._id.toString());
									},
								}}
							/>
							<Button
								size="small"
								text={"Discard"}
								variant={"link"}
								onClick={(e) => {
									e.stopPropagation();
									refreshDocument(document);
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
			documentContextMenu,
			startEditingDocument,
			stopEditingDocument,
			updateDocument,
			refreshDocument,
			removeDocumentUpdates,
		]
	);

	console.log("UPDATES", updates);
	console.log("BSON", bson);

	return (
		<div className="tree-viewer">
			<div className="header">Header</div>
			<div className="content">
				{bson && bson.length && (
					<CollapseList content={bson.map(createDocumentPanelListContent)} />
				)}
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
