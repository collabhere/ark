import "./styles.less";

import React from "react";
import { Button } from "../../common/components/Button";
import { Dropdown, Menu } from "antd";
import { VscFileCode, VscClose } from "react-icons/vsc";
import { useState } from "react";
import { SelectConnectionForFilePath } from "../dialogs/SelectConnectionForScript";

export const PageHeader = (): JSX.Element => {
	const [openScriptPath, setOpenScriptPath] = useState("");
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
