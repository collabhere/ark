import "./styles.less";

import React, { useCallback, useEffect } from "react";
import { Button } from "../../common/components/Button";
import { Dropdown, Menu } from "antd";
import { VscFileCode, VscClose, VscWatch } from "react-icons/vsc";
import { useState } from "react";
import { SelectConnectionForFilePath } from "../dialogs/SelectConnectionForScript";
import SubMenu from "antd/lib/menu/SubMenu";
import jstz, { TimeZone } from "jstz";

export const PageHeader = (): JSX.Element => {
	const [openScriptPath, setOpenScriptPath] = useState("");
	const [generalSettings, setGeneralSettings] = useState<Ark.GeneralSettings>(
		{}
	);

	useEffect(() => {
		window.ark.settings
			.fetch("general")
			.then((settings) => {
				if (settings) {
					setGeneralSettings(settings);
				}
			})
			.catch((err) => {
				console.log("Error", err);
			});
	}, []);

	const changeSettings = useCallback(
		(
			setting: keyof Ark.GeneralSettings,
			value: ReturnType<TimeZone["name"]>
		) => {
			const settings = {
				...generalSettings,
				[setting]: value,
			};

			window.ark.settings.save("general", settings).catch((err) => {
				console.log("Error", err);
			});
		},
		[generalSettings]
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
								<Menu.Item
									onClick={() =>
										changeSettings("timezone", jstz.determine().name())
									}
								>
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
