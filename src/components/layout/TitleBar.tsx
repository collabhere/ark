import "./styles.less";

import React, { useCallback, useContext } from "react";
import { Button } from "../../common/components/Button";
import { Menu, MenuItem, MenuDivider } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { VscFileCode, VscClose, VscWatch, VscTerminal } from "react-icons/vsc";
import { useState } from "react";
import { SelectConnectionForFilePath } from "../dialogs/SelectConnectionForScript";
import { Dialog } from "../../common/components/Dialog";
import { Checkbox, InputGroup } from "@blueprintjs/core";
import { notify } from "../../common/utils/misc";
import { useEffect } from "react";
import { SettingsContext } from "./BaseContextProvider";

export const TitleBar = (): JSX.Element => {
	const { settings, setSettings } = useContext(SettingsContext);

	const [openScriptPath, setOpenScriptPath] = useState("");
	const [timeoutDialog, setTimeoutDialog] = useState(false);
	const [localSettings, setLocalsettings] = useState({
		shellTimeout: "120",
		lineNumbers: true,
		miniMap: false,
		autoUpdates: true,
		hotKeys: true,
	});

	useEffect(() => {
		setLocalsettings({
			shellTimeout: settings?.shellTimeout?.toString() || "120",
			lineNumbers: settings?.lineNumbers === "off" ? false : true,
			miniMap: settings?.miniMap === "on" ? true : false,
			autoUpdates: settings?.autoUpdates === "off" ? false : true,
			hotKeys: settings?.hotKeys === "off" ? false : true,
		});
	}, [
		settings?.autoUpdates,
		settings?.hotKeys,
		settings?.lineNumbers,
		settings?.miniMap,
		settings?.shellTimeout,
	]);

	const changeSettings = useCallback(
		function <T extends keyof Ark.Settings>(
			setting: T,
			value: Ark.Settings[T]
		) {
			setSettings && setSettings((s) => ({ ...s, [setting]: value }));
			window.ark.settings
				.save("general", { ...settings, [setting]: value })
				.then(() => {
					notify({
						title: "Success!",
						description: "Settings saved successfully.",
						type: "success",
					});
				})
				.catch((err) => {
					console.log("Error", err);
					notify({
						title: "Error!",
						description: err.message ? err.message : err.toString(),
						type: "error",
					});
				});
		},
		[setSettings, settings]
	);

	return (
		<div className="title-bar">
			<div className="header-container">
				<div className="logo">Ark</div>
				<div>
					<Popover2
						content={
							<Menu>
								<MenuItem
									text="Open Script"
									onClick={() => {
										window.ark
											.browseForFile("Select A File", "Select")
											.then((result) => {
												const { path } = result;
												setOpenScriptPath(path);
											});
									}}
									icon={<VscFileCode />}
									key="0"
								/>
								<MenuDivider />
								<MenuItem text="Timezone" icon={<VscWatch />} key="1">
									<MenuItem
										text="Local Timezone"
										onClick={() =>
											changeSettings<"timezone">("timezone", "local")
										}
									/>
									<MenuItem
										text="UTC"
										onClick={() =>
											changeSettings<"timezone">("timezone", "utc")
										}
									/>
								</MenuItem>
								<MenuDivider />
								<MenuItem
									text="Change Shell Timeout"
									icon={<VscTerminal />}
									key="2"
									onClick={() => setTimeoutDialog(true)}
								/>
								<MenuDivider />
								<MenuItem
									key="3"
									text={
										<Checkbox
											checked={localSettings.lineNumbers}
											label={"Show Line Numbers"}
											onChange={(e) => {
												const showLineNumbers = (e.target as HTMLInputElement)
													.checked
													? "on"
													: "off";
												changeSettings("lineNumbers", showLineNumbers);
											}}
										/>
									}
								/>
								<MenuDivider />
								<MenuItem
									key="4"
									text={
										<Checkbox
											checked={localSettings.miniMap}
											label={"Show Mini Map"}
											onChange={(e) => {
												const showMiniMap = (e.target as HTMLInputElement)
													.checked
													? "on"
													: "off";
												changeSettings("miniMap", showMiniMap);
											}}
										/>
									}
								/>
								<MenuDivider />
								<MenuItem
									key="5"
									text={
										<Checkbox
											checked={localSettings.hotKeys}
											label={"Enable hotkeys"}
											onChange={(e) => {
												const enableHotkeys = (e.target as HTMLInputElement)
													.checked
													? "on"
													: "off";
												changeSettings("hotKeys", enableHotkeys);
											}}
										/>
									}
								/>
								<MenuDivider />
								<MenuItem
									key="6"
									text={
										<Checkbox
											checked={localSettings.autoUpdates}
											label={"Auto Updates"}
											onChange={(e) => {
												const autoUpdates = (e.target as HTMLInputElement)
													.checked
													? "on"
													: "off";
												changeSettings("autoUpdates", autoUpdates);
											}}
										/>
									}
								/>
								<MenuDivider />
								<MenuItem
									intent="danger"
									text="Exit"
									icon={<VscClose />}
									key="7"
									onClick={() => window.ark.titlebar.close()}
								/>
							</Menu>
						}
						interactionKind={"click"}
					>
						<div className="header-item">
							<Button size="small" text="Options" />
						</div>
					</Popover2>
				</div>
			</div>

			<div className="header-container">
				<Button
					icon="minimize"
					onClick={() => window.ark.titlebar.minimize()}
				/>
				<Button
					icon="maximize"
					onClick={() => window.ark.titlebar.maximize()}
				/>
				<Button
					icon="cross"
					variant="danger"
					onClick={() => window.ark.titlebar.close()}
				/>
			</div>

			{openScriptPath && (
				<SelectConnectionForFilePath
					path={openScriptPath}
					onClose={() => setOpenScriptPath("")}
				/>
			)}
			{timeoutDialog && (
				<Dialog
					size="small"
					confirmButtonText="Change"
					onCancel={() => setTimeoutDialog(false)}
					onConfirm={() => {
						const timeout = Number(localSettings.shellTimeout);
						if (isNaN(timeout)) {
							return notify({
								description: "Timeout must be a number!",
								type: "error",
							});
						}

						changeSettings("shellTimeout", timeout);
						setTimeoutDialog(false);
					}}
					title={"Change Shell Timeout"}
				>
					<div>
						<InputGroup
							value={localSettings.shellTimeout.toString()}
							onChange={(event) =>
								setLocalsettings((ls) => ({
									...ls,
									shellTimeout: event.target.value,
								}))
							}
							placeholder={"Shell timeout (in seconds)"}
						/>
					</div>
				</Dialog>
			)}
		</div>
	);
};
