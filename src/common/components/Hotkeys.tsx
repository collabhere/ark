import React, { FC } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { dispatch } from "../../../util/events";

export enum HOT_KEYS {
	CONNECTION_TOGGLE = "ctrl+e",
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface HotkeysProps {}

export const Hotkeys: FC<HotkeysProps> = () => {
	useHotkeys(HOT_KEYS.CONNECTION_TOGGLE, () => {
		dispatch("explorer:hide");
		dispatch("connection_manager:toggle");
	});

	return <></>;
};
