import React, { FC, useContext, useEffect, useState } from "react";
import { useCallback } from "react";
import { StoredScript } from "../../../electron/modules/ipc";
import { Dialog } from "../../common/components/Dialog";
import { CircularLoading } from "../../common/components/Loading";
import { dispatch } from "../../common/utils/events";
import { ConnectionsList } from "../connection-controller/ConnectionController";
import {
	ConnectionsContext,
	ManagedConnection,
} from "../layout/BaseContextProvider";

interface SelectConnectionForScriptProps {
	path: string;
	/* conn will be undefined if no connection is selected */
	onClose?: (conn?: Ark.StoredConnection) => void;
}

export const SelectConnectionForFilePath: FC<
	SelectConnectionForScriptProps
> = ({ path, onClose }) => {
	const [loading, setLoading] = useState(false);

	const { connections, load, connect } = useContext(ConnectionsContext);

	const [databaseOptions, setDatabaseOptions] = useState<
		(string | undefined)[]
	>([]);
	const [code, setCode] = useState<string>();
	const [selectedStoredConnection, setSelectedStoredConnection] =
		useState<ManagedConnection>();
	const [storedScript, setStoredScript] = useState<StoredScript>();

	const openShell = useCallback(
		(database) => {
			if (database && selectedStoredConnection) {
				dispatch("browser:create_tab:editor", {
					shellConfig: { ...selectedStoredConnection },
					contextDB: typeof database === "string" ? database : database.name,
					collections: [],
					storedConnectionId: selectedStoredConnection.id,
					initialCode: code,
					scriptId: storedScript?.id,
				});

				dispatch("sidebar:add_item", {
					id: selectedStoredConnection.id,
					name: selectedStoredConnection.name,
					icon: selectedStoredConnection.icon,
				});

				onClose && onClose(selectedStoredConnection);
			}
		},
		[code, onClose, selectedStoredConnection, storedScript?.id]
	);

	/** On-load effect */
	useEffect(() => {
		setLoading(true);
		load().then(() => {
			setLoading(false);
		});
	}, [load]);

	return (
		<Dialog
			size="large"
			title={
				databaseOptions && databaseOptions.length
					? "Select a database"
					: "Select a connection"
			}
			onCancel={onClose}
			noFooter
		>
			{loading ? (
				<CircularLoading />
			) : databaseOptions && databaseOptions.length ? (
				<div>
					{databaseOptions.map((option) => (
						<button key={option} onClick={() => openShell(option)}>
							{option}
						</button>
					))}
				</div>
			) : (
				<ConnectionsList
					connections={connections}
					listViewMode="compact"
					onConnect={(conn) => {
						return window.ark.scripts
							.open({
								fileLocation: path,
								storedConnectionId: conn.id,
							})
							.then((result) => {
								const { code: storedCode, script } = result;
								return connect(conn.id).then((connection) => {
									if (connection) {
										return window.ark.driver
											.run("connection", "listDatabases", { id: conn.id })
											.then((result) => {
												const databases: string[] = result.map(
													(database) => database.name
												);
												setDatabaseOptions(databases);
												setCode(storedCode);
												setSelectedStoredConnection(connection);
												setStoredScript(script);
											});
									}
								});
							});
					}}
				/>
			)}
		</Dialog>
	);
};
