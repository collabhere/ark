import "./styles.less";

import React, { useCallback, useContext } from "react";
import { Button } from "../../common/components/Button";
import { Dropdown, Menu } from "antd";
import { VscFileCode, VscClose, VscWatch } from "react-icons/vsc";
import { useState } from "react";
import { SelectConnectionForFilePath } from "../dialogs/SelectConnectionForScript";
import SubMenu from "antd/lib/menu/SubMenu";
import { SettingsContext } from "../../App";

export const PageHeader = (): JSX.Element => {
	const [openScriptPath, setOpenScriptPath] = useState("");
	const { settings, setSettings } = useContext(SettingsContext);

	const changeSettings = useCallback(
		(setting: keyof Ark.Settings, value: "local" | "utc") => {
			setSettings && setSettings((s) => ({ ...s, [setting]: value }));
			window.ark.settings
				.save("general", { ...settings, [setting]: value })
				.catch((err) => {
					console.log("Error", err);
				});
		},
		[setSettings, settings]
	);

	return (
		<div className="PageHeader">
			{openScriptPath && (
				<SelectConnectionForFilePath
					path={openScriptPath}
					onCancel={() => setOpenScriptPath("")}
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
						<Menu.Item icon={<VscClose />} key="1">
							<a>Exit</a>
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item icon={<VscWatch />} key="2">
							<SubMenu title="Timezone">
								<Menu.Item onClick={() => changeSettings("timezone", "local")}>
									Local Timezone
								</Menu.Item>
								<Menu.Item onClick={() => changeSettings("timezone", "utc")}>
									{" "}
									UTC
								</Menu.Item>
							</SubMenu>
						</Menu.Item>
					</Menu>
				}
				trigger={["click"]}
			>
				<div className="PageHeaderItem">
					<Button size="small" text="Options" variant="link" />
				</div>
			</Dropdown>
		</div>
	);
};
