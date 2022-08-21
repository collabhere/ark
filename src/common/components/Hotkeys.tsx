import React, { FC } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { dispatch } from "../../common/utils/events";

export enum HOT_KEYS {
	CONNECTION_TOGGLE = "ctrl+e",
	NEW_CONNECTION = "ctrl+n",
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface HotkeysProps {}

export const Hotkeys: FC<HotkeysProps> = () => {
	useHotkeys(HOT_KEYS.CONNECTION_TOGGLE, () => {
		dispatch("OPEN_CONNECTION_CONTROLLER");
	});

	useHotkeys(HOT_KEYS.NEW_CONNECTION, () => {
		dispatch("browser:create_tab:connection_form");
	});

	return <></>;
};
