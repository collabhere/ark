import "./styles.less";

import React, { useCallback, useContext } from "react";
import { Button } from "../../common/components/Button";
import { Dropdown, Menu } from "antd";
import { VscFileCode, VscClose, VscWatch, VscTerminal } from "react-icons/vsc";
import { useState } from "react";
import { SelectConnectionForFilePath } from "../dialogs/SelectConnectionForScript";
import SubMenu from "antd/lib/menu/SubMenu";
import { SettingsContext } from "../../App";
import { Dialog } from "../../common/components/Dialog";
import { Checkbox, InputGroup } from "@blueprintjs/core";
import { notify } from "../../common/utils/misc";
import { useEffect } from "react";

export const PageHeader = (): JSX.Element => {
	const [openScriptPath, setOpenScriptPath] = useState("");
	const { settings, setSettings } = useContext(SettingsContext);
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
		<div className="PageHeader">
			{openScriptPath && (
				<SelectConnectionForFilePath
					path={openScriptPath}
					onClose={() => setOpenScriptPath("")}
				/>
			)}
			<div className="PageHeaderLogo">Ark</div>
			<Dropdown
				overlay={
					<Menu>
						<Menu.Item
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
						>
							<a>Open Script</a>
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item icon={<VscWatch />} key="1">
							<SubMenu title="Timezone">
								<Menu.Item
									onClick={() =>
										changeSettings<"timezone">("timezone", "local")
									}
								>
									Local Timezone
								</Menu.Item>
								<Menu.Item
									onClick={() => changeSettings<"timezone">("timezone", "utc")}
								>
									{" "}
									UTC
								</Menu.Item>
							</SubMenu>
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item
							icon={<VscTerminal />}
							key="2"
							onClick={() => setTimeoutDialog(true)}
						>
							<a>Change Shell Timeout</a>
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item key="3">
							<Checkbox
								checked={localSettings.lineNumbers}
								label={"Show Line Numbers"}
								onChange={(e) => {
									const showLineNumbers = (e.target as HTMLInputElement).checked
										? "on"
										: "off";
									changeSettings("lineNumbers", showLineNumbers);
								}}
							/>
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item key="4">
							<Checkbox
								checked={localSettings.miniMap}
								label={"Show Mini Map"}
								onChange={(e) => {
									const showMiniMap = (e.target as HTMLInputElement).checked
										? "on"
										: "off";
									changeSettings("miniMap", showMiniMap);
								}}
							/>
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item key="5">
							<Checkbox
								checked={localSettings.hotKeys}
								label={"Enable hotkeys"}
								onChange={(e) => {
									const enableHotkeys = (e.target as HTMLInputElement).checked
										? "on"
										: "off";
									changeSettings("hotKeys", enableHotkeys);
								}}
							/>
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item key="6">
							<Checkbox
								checked={localSettings.autoUpdates}
								label={"Auto Updates"}
								onChange={(e) => {
									const autoUpdates = (e.target as HTMLInputElement).checked
										? "on"
										: "off";
									changeSettings("autoUpdates", autoUpdates);
								}}
							/>
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item icon={<VscClose />} key="7">
							<a>Exit</a>
						</Menu.Item>
						<Menu.Divider />
					</Menu>
				}
				trigger={["click"]}
			>
				<div className="PageHeaderItem">
					<Button size="small" text="Options" variant="link" />
				</div>
			</Dropdown>
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
