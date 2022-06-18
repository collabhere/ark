import "../styles.less";
import "../../../../../common/styles/layout.less";

import React, { FC, useState, useEffect, PropsWithChildren } from "react";
import { ObjectId, serialize } from "bson";
import { useCallback } from "react";
import Bluebird from "bluebird";
import {
	DocumentField,
	ContentRowActions,
	DocumentConfig,
	DocumentList,
} from "./DocumentList";
import {
	Icon,
	MenuItem,
	InputGroup,
	NumericInput,
	IconSize,
} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { DateInput } from "@blueprintjs/datetime";
import { Button } from "../../../../../common/components/Button";
import { DangerousActionPrompt } from "../../../../dialogs/DangerousActionPrompt";
import { handleErrors, notify } from "../../../../../common/utils/misc";
import { isObjectId } from "../../../../../../util/misc";
import { createContextMenuItems, CreateMenuItem } from "./ContextMenu";

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
}

const SwitchableInput: FC<SwitchableInputProps> = (props) => {
	const {
		onCommit,
		onKeyRemove,
		onChange,
		initialType,
		field,
		value,
		editable,
		editableKey,
	} = props;

	const [type, setType] = useState(initialType);
	const [editedKey, setEditedKey] = useState(field);
	const [editedValue, setEditedValue] = useState(value);
	const [commited, setCommited] = useState(false);
	const [deleted, setDeleted] = useState(false);

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

	const onUndoAction = () => {
		setDeleted(false);
		onChange && onChange(editedKey, editedValue);
	};

	const onDeleteAction = (key: string) => {
		setDeleted(true);
		onKeyRemove && onKeyRemove(key);
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
								onClick={() =>
									deleted ? onUndoAction() : onDeleteAction(field)
								}
								size={"small"}
								icon={deleted ? "undo" : "delete"}
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
					`ISODate("` + date.toISOString() + `")`
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
		<>
			<div className="left">{editableKey ? keyInput : field}</div>
			<div className="modified">
				{isModified && editable && (
					<Icon icon="symbol-circle" size={IconSize.STANDARD} />
				)}
			</div>
			<div className="right">{jsx}</div>
		</>
	);
};

interface ContentBuilderOptions {
	document: Ark.BSONDocument | Ark.BSONArray | Ark.BSONTypes[];
	enableInlineEdits: boolean;
	allowModifyActions: boolean;
	onChange(
		changed: "update_value" | "delete_key",
		key: string,
		value?: Ark.BSONTypes
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
	const {
		document,
		enableInlineEdits,
		onChange,
		onRowAction,
		allowModifyActions,
	} = contentBuilderOptions;

	const onValueChange = (key: string, newValue: Ark.BSONTypes) =>
		onChange && onChange("update_value", key, newValue);

	const onKeyRemove = (key: string) => onChange && onChange("delete_key", key);

	const rows = Object.entries(document).reduce<React.ReactNode[]>(
		(rows, [key, value], rowIdx) => {
			const { type } = testBsonValue(value);

			let inputJSX;

			// console.log("KEY", key, "TYPE", type, "VALUE", value);
			switch (type) {
				case "oid": {
					inputJSX = (
						<SwitchableInput
							key={key + "_idx_" + rowIdx}
							initialType={type}
							field={key}
							value={value as ObjectId}
							editable={enableInlineEdits}
							onAction={(action) => onRowAction(action, key, value)}
							onCommit={onValueChange}
							onKeyRemove={onKeyRemove}
						/>
					);
					break;
				}
				case "isodate": {
					inputJSX = (
						<SwitchableInput
							key={key + "_idx_" + rowIdx}
							initialType={"date"}
							field={key}
							value={value as Date}
							editable={enableInlineEdits}
							onAction={(action) => onRowAction(action, key, value)}
							onCommit={onValueChange}
							onKeyRemove={onKeyRemove}
						/>
					);
					break;
				}
				case "number": {
					inputJSX = (
						<SwitchableInput
							key={key + "_idx_" + rowIdx}
							initialType={type}
							field={key}
							value={value as number}
							editable={enableInlineEdits}
							onAction={(action) => onRowAction(action, key, value)}
							onCommit={onValueChange}
							onKeyRemove={onKeyRemove}
						/>
					);
					break;
				}
				case "boolean": {
					inputJSX = (
						<SwitchableInput
							key={key + "_idx_" + rowIdx}
							initialType={type}
							field={key}
							value={value as boolean}
							editable={enableInlineEdits}
							onAction={(action) => onRowAction(action, key, value)}
							onCommit={onValueChange}
							onKeyRemove={onKeyRemove}
						/>
					);
					break;
				}
				case "null":
				case "string": {
					inputJSX = (
						<SwitchableInput
							key={key + "_idx_" + rowIdx}
							initialType={"text"}
							field={key}
							value={String(value) as string}
							editable={enableInlineEdits}
							onAction={(action) => onRowAction(action, key, value)}
							onCommit={onValueChange}
							onKeyRemove={onKeyRemove}
						/>
					);
					break;
				}
				case "primitive[]": {
					const bsonTypes = value as Ark.BSONTypes[];
					inputJSX = (
						<DocumentList
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
					inputJSX = (
						<DocumentList
							key={key}
							content={[
								{
									jsx: (
										<DocumentList
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
													key: String(index),
													title: "(" + String(index + 1) + ")",
												},
											}))}
										/>
									),
									header: {
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
					inputJSX = (
						<DocumentList
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
					inputJSX = (
						<div style={{ display: "flex" }} key={key}>
							<div style={{ width: "50%" }}>{key}</div>
							<div style={{ width: "50%" }}>{}</div>
						</div>
					);
			}

			rows.push(
				<DocumentField
					onContextMenuAction={(action) => onRowAction(action, key, value)}
					key={key}
					enableInlineEdits={!!enableInlineEdits}
					allowModifyActions={allowModifyActions}
				>
					{inputJSX}
				</DocumentField>
			);

			return rows;
		},
		[]
	);

	if (enableInlineEdits) {
		rows.push(<NewFieldRows key={rows.length} onChange={onValueChange} />);
	}

	return rows;
};

interface NewFieldRowsProps {
	onChange?: (key: string, value: Ark.BSONTypes) => void;
}
const NewFieldRows: FC<NewFieldRowsProps> = (props) => {
	const { onChange } = props;

	const [rows, setRows] = useState<
		{ key: string; value: Ark.BSONTypes; commited?: boolean }[]
	>([]);
	const [addingKeys, setAddingKeys] = useState<boolean>(false);

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
	allowModifyActions: boolean;
	enableInlineEdits: boolean;
	onDocumentModified: ContentBuilderOptions["onChange"];
	onDocumentEdit: () => void;
	onDocumentDelete: () => void;
	onDocumentChangeDiscard: () => void;
}
const DocumentPanel: FC<DocumentPanelProps> = (props) => {
	const {
		document,
		allowModifyActions,
		enableInlineEdits = false,
		onDocumentModified,
		onDocumentEdit,
		onDocumentDelete,
		onDocumentChangeDiscard,
	} = props;

	const onRowAction = useCallback(
		(action: ContentRowActions, key: string, value: Ark.BSONTypes) => {
			// console.log(`[onRowAction] action=${action} key=${key} value=${value}`);
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
				case ContentRowActions.discard_edit: {
					onDocumentChangeDiscard();
					break;
				}
				case ContentRowActions.delete_document: {
					onDocumentDelete();
					break;
				}
			}
		},
		[onDocumentEdit, onDocumentChangeDiscard, onDocumentDelete]
	);

	return (
		<>
			{contentBuilder({
				document,
				enableInlineEdits,
				allowModifyActions,
				onChange: onDocumentModified,
				onRowAction: (action, key, value) =>
					onRowAction(action, String(key), value),
			})}
		</>
	);
};

interface Update {
	_id: string;
	update: {
		[k in "$set" | "$unset"]: Ark.BSONTypes | undefined;
	};
}

interface JSONViewerProps {
	bson: Ark.BSONArray;
	driverConnectionId: string;
	shellConfig: Ark.ShellConfig;
	onRefresh: () => void;
	allowDocumentEdits: boolean;
}

export const TreeViewer: FC<JSONViewerProps> = (props) => {
	const {
		bson,
		driverConnectionId,
		shellConfig,
		allowDocumentEdits,
		onRefresh,
	} = props;

	const [updates, setUpdates] = useState<Array<Update>>([]);
	const [docsBeingEdited, setDocsBeingUpdated] = useState<
		Set<Ark.BSONDocument>
	>(new Set());
	const [showSaveAllDialog, setShowSaveAllDialog] = useState(false);
	const [showSaveDialog, setShowSaveDialog] = useState(false);
	const [docBeingSaved, setDocBeingSaved] = useState<Ark.BSONDocument>();
	const [docBeingDeleted, setDocBeingDeleted] = useState<Ark.BSONDocument>();
	const [refreshCounts, setRefreshCounts] = useState({});

	const driverArgs = useCallback(
		(args) => ({
			id: driverConnectionId,
			database: shellConfig.database,
			collection: shellConfig.collection,
			...args,
		}),
		[driverConnectionId, shellConfig.collection, shellConfig.database]
	);

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

	const unsetKey = (id: string, key: string) =>
		setUpdates((updates) => {
			const idx = updates.findIndex((u) => u._id === id);
			if (idx > -1) {
				if (updates[idx].update.$unset) {
					(updates[idx].update.$unset as any)[key] = "";
				} else {
					(updates[idx].update.$unset as any) = { [key]: "" };
				}
			} else {
				updates.push({
					_id: id,
					update: {
						$unset: { [key]: "" },
						$set: undefined,
					},
				});
			}
			return Array.from(updates);
		});

	const setKeyValue = (id: string, key: string, value: Ark.BSONTypes) =>
		setUpdates((updates) => {
			const idx = updates.findIndex((u) => u._id === id);
			if (idx > -1) {
				if (updates[idx].update.$set) {
					(updates[idx].update.$set as any)[key] = value;
				} else {
					(updates[idx].update.$set as any) = { [key]: value };
				}
			} else {
				updates.push({
					_id: id,
					update: {
						$set: { [key]: value },
						$unset: undefined,
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

	const updateAllDocuments = useCallback((): Promise<void> => {
		return Bluebird.map(updates, (update) => {
			return window.ark.driver
				.run(
					"query",
					"updateOne",
					driverArgs({
						query: serialize({
							_id: new ObjectId(update._id),
						}),
						update: serialize(update.update),
					})
				)
				.then(() => update)
				.catch((err) => {
					removeDocumentUpdates(update._id);
					handleErrors(err, driverConnectionId);
				});
		}).then((updates) =>
			updates.forEach((update) => removeDocumentUpdates(update._id))
		);
	}, [driverArgs, driverConnectionId, removeDocumentUpdates, updates]);

	const updateDocument = useCallback(
		(documentId: string) => {
			const current = updates.find((update) => update._id === documentId);

			if (current) {
				return window.ark.driver
					.run(
						"query",
						"updateOne",
						driverArgs({
							query: serialize({
								_id: new ObjectId(current._id),
							}),
							update: serialize(current.update),
						})
					)
					.then((result) => {
						removeDocumentUpdates(documentId);
						onRefresh();
						return result;
					})
					.catch((err) => {
						removeDocumentUpdates(documentId);
						handleErrors(err, driverConnectionId);
						return Promise.reject(err);
					});
			} else {
				console.log("no updates found for", documentId);
				return Promise.resolve();
			}
		},
		[driverArgs, driverConnectionId, onRefresh, removeDocumentUpdates, updates]
	);

	const discardChanges = useCallback(
		(document: Ark.BSONDocument) => {
			refreshDocument(document);
			removeDocumentUpdates(document._id.toString());
			stopEditingDocument(document);
		},
		[refreshDocument, removeDocumentUpdates, stopEditingDocument]
	);

	const documentContextMenu = useCallback(
		(document: any, allowEdits: boolean) => {
			const items: CreateMenuItem[] = [
				{
					item: "Copy JSON",
					cb: () => window.ark.copyText(JSON.stringify(document, null, 4)),
					intent: "primary",
					icon: "comparison",
					key: ContentRowActions.copy_json,
				},
			];

			if (allowEdits) {
				items.push(
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
					}
				);

				items.splice(
					1,
					0,
					docsBeingEdited.has(document)
						? {
								item: "Discard Edits",
								cb: () => {
									discardChanges(document);
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
			}

			return createContextMenuItems(items);
		},
		[discardChanges, docsBeingEdited, startEditingDocument]
	);

	const createDocumentPanelListContent = useCallback(
		(document, index): DocumentConfig => {
			return {
				jsx: (
					<DocumentPanel
						allowModifyActions={allowDocumentEdits}
						enableInlineEdits={docsBeingEdited.has(document)}
						document={document}
						key={(refreshCounts[document._id] || 0) + "" + index}
						onDocumentModified={(change, key, value) => {
							if (change === "update_value" && typeof value !== "undefined") {
								setKeyValue(document._id.toString(), key, value);
							} else if (change === "delete_key") {
								unsetKey(document._id.toString(), key);
							}
						}}
						onDocumentEdit={() => startEditingDocument(document)}
						onDocumentDelete={() => setDocBeingDeleted(document)}
						onDocumentChangeDiscard={() => discardChanges(document)}
					/>
				),
				header: {
					menu: documentContextMenu(document, allowDocumentEdits),
					primary: true,
					key: index,
					title: `(${String(index + 1)}) ${
						document && document._id && isObjectId(document._id)
							? `ObjectId("${document._id.toString()}")`
							: document && document._id
							? `${document._id}`
							: ``
					}`,
					rightElement: docsBeingEdited.has(document) ? (
						<div className="document-header-buttons">
							<Button
								size="small"
								text={"Save"}
								variant={"link"}
								onClick={(e) => {
									e.stopPropagation();
									setDocBeingSaved(document);
									setShowSaveDialog(true);
								}}
							/>
							<Button
								size="small"
								text={"Discard"}
								variant={"link"}
								onClick={(e) => {
									e.stopPropagation();
									discardChanges(document);
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
			refreshCounts,
			allowDocumentEdits,
			documentContextMenu,
			startEditingDocument,
			discardChanges,
		]
	);

	// console.log("UPDATES", updates);
	// console.log("BSON", bson);

	return (
		<div className="tree-viewer">
			<div className="header">
				{docsBeingEdited.size === 0 && (
					<Button
						disabled={!allowDocumentEdits}
						onClick={() => bson.map((doc) => startEditingDocument(doc))}
						size={"small"}
						icon="edit"
						variant={"link"}
						text="Edit All"
					/>
				)}
				{docsBeingEdited.size > 0 && (
					<>
						<Button
							onClick={() => setShowSaveAllDialog(true)}
							size={"small"}
							icon="small-tick"
							variant={"link"}
							text="Save All"
						/>
						<Button
							onClick={() => {
								clearUpdates();
								onRefresh();
							}}
							size={"small"}
							icon="small-cross"
							variant={"link-danger"}
							text="Discard All"
						/>
					</>
				)}
			</div>
			<div className="content">
				{bson && bson.length && (
					<DocumentList content={bson.map(createDocumentPanelListContent)} />
				)}
			</div>
			{/* Dialogs */}
			<>
				{docBeingDeleted && (
					<DangerousActionPrompt
						dangerousAction={() => {
							return window.ark.driver.run(
								"query",
								"deleteOne",
								driverArgs({
									query: serialize({
										_id: new ObjectId(docBeingDeleted._id),
									}),
								})
							);
						}}
						dangerousActionCallback={() => {
							setDocBeingDeleted(undefined);
							onRefresh();
						}}
						onCancel={() => {
							setDocBeingDeleted(undefined);
						}}
						prompt={
							<>
								<p>{"Are you sure you would like to delete this document?"}</p>
								<p>{"Object ID - " + docBeingDeleted._id.toString()}</p>
								<br />
								<p>
									{`This deletion will be run on the collection - ${shellConfig.collection}. `}
									<a>Change</a>
								</p>
							</>
						}
						title={"Deleting Document"}
					/>
				)}
				{showSaveAllDialog && (
					<DangerousActionPrompt
						dangerousAction={() => updateAllDocuments()}
						dangerousActionCallback={(err) => {
							if (err) {
								notify({
									title: "Update",
									description: err.message,
									type: "error",
								});
							} else {
								notify({
									title: "Update",
									description: "All documents updated",
									type: "success",
								});
							}
							setShowSaveAllDialog(false);
							onRefresh();
						}}
						onCancel={() => {
							setShowSaveAllDialog(false);
						}}
						prompt={
							<UpdatesList
								collection={shellConfig.collection}
								updates={updates}
							/>
						}
						title={"Saving Changes"}
					/>
				)}
				{showSaveDialog && docBeingSaved && (
					<DangerousActionPrompt
						dangerousAction={() => updateDocument(docBeingSaved._id.toString())}
						dangerousActionCallback={(err, result) => {
							if (err || !result.ack) {
								notify({
									title: "Update",
									description: "Document update failed",
									type: "error",
								});
							} else {
								notify({
									title: "Update",
									description: "Document updated succesfully",
									type: "success",
								});
							}
							setShowSaveDialog(false);
							onRefresh();
						}}
						onCancel={() => {
							setShowSaveDialog(false);
						}}
						prompt={
							<UpdatesList
								collection={shellConfig.collection}
								updates={updates.filter(
									(update) => update._id === docBeingSaved._id.toString()
								)}
							/>
						}
						title={"Saving Changes"}
					/>
				)}
			</>
		</div>
	);
};

interface UpdateListProps {
	updates: Update[];
	collection: string;
}

const UpdatesList: FC<UpdateListProps> = (props) => {
	const { updates } = props;
	return (
		<div className="updates-list">
			{updates.length
				? updates.map((update) => (
						<div className="item" key={update._id.toString()}>
							<p>{`ID - ${update._id.toString()}`}</p>

							<code>{JSON.stringify(update.update)}</code>
						</div>
				  ))
				: `No changes were made.`}
		</div>
	);
};
