import React, { FC, useEffect, useState } from "react";
import { useCallback } from "react";
import { StoredScript } from "../../../electron/modules/ipc";
import { Dialog } from "../../common/components/Dialog";
import { CircularLoading } from "../../common/components/Loading";
import { dispatch } from "../../common/utils/events";
import { ConnectionsList } from "../connection-manager/ConnectionManager";

interface SelectConnectionForScriptProps {
	path: string;
	onCancel?: () => void;
	/* conn will be undefined if no connection is selected */
	onClose?: (conn?: Ark.StoredConnection) => void;
}

export const SelectConnectionForFilePath: FC<SelectConnectionForScriptProps> =
	({ path, onCancel, onClose }) => {
		const [loading, setLoading] = useState(false);
		const [connections, setConnections] = useState<Ark.StoredConnection[]>([]);

		const [databaseOptions, setDatabaseOptions] = useState<
			(string | undefined)[]
		>([]);
		const [code, setCode] = useState<string>();
		const [selectedStoredConnection, setSelectedStoredConnection] =
			useState<Ark.StoredConnection>();
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

		const connect = useCallback(
			(conn: Ark.StoredConnection) => {
				return window.ark.scripts
					.open({
						fileLocation: path,
						storedConnectionId: conn.id,
					})
					.then((result) => {
						const { code: storedCode, script } = result;
						const id = conn.id;
						return window.ark.driver
							.run("connection", "connect", { id })
							.then(() =>
								window.ark.driver
									.run("connection", "load", { id })
									.then((connection) => {
										return window.ark.driver
											.run("connection", "listDatabases", { id })
											.then((result) => {
												console.log("LIST RESULT", result);
												const databases: (string | undefined)[] = [
													...result,
												].map((database) => {
													if (typeof database === "string") {
														if (
															database !== "local" &&
															database !== "admin" &&
															database !== "config"
														)
															return database;
													} else {
														if (
															database.name !== "local" &&
															database.name !== "admin" &&
															database.name !== "config"
														)
															return database.name;
													}
												});
												setDatabaseOptions(databases);
												setCode(storedCode);
												setSelectedStoredConnection(connection);
												setStoredScript(script);
											});
									})
							);
					});
			},
			[path]
		);

		/** On-load effect */
		useEffect(() => {
			setLoading(true);
			window.ark.driver
				.run("connection", "list", undefined)
				.then((connections) => {
					setConnections(Object.values(connections));
					setLoading(false);
				});
			return () => setConnections([]);
		}, []);

		return (
			<Dialog
				size="large"
				title="Select a connection"
				onCancel={onCancel}
				onClose={onClose}
				noFooter
			>
				{loading ? (
					<CircularLoading />
				) : databaseOptions && databaseOptions.length ? (
					<div>
						Select a database{" "}
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
						onConnect={connect}
					/>
				)}
			</Dialog>
		);
	};
