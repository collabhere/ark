import os from "os";
import path from "path";

export const ARK_FOLDER_NAME = ".ark";
export const ARK_FOLDER_PATH = path.join(os.homedir(), ARK_FOLDER_NAME);
export const ERRORS = {
	AR600: "SSH Tunnel Closed",
	AR601: "Connection closed"
};
