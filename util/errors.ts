/**
 * Error codes and messages that are shared between the
 * main process (electron) and the renderer process (react)
 */

/**
 * @description
 * Key Format - PARENT_MODULE$SUB_MODULE$ERROR
 * Value Format - PARENT_MODULE_SUB_MODULE_ERROR
 * SUB_MODULE is optional
 */
export enum ERR_CODES {
    CORE$DRIVER$NO_STORED_CONNECTION = "E_CORE_DRIVER_NOSTORE",
    CORE$DRIVER$NO_CACHED_CONNECTION = "E_CORE_DRIVER_NOCACHE",
    CORE$DRIVER$SSH_TUNNEL_CLOSED = "E_CORE_DRIVER_SSH_TUNNEL_CLOSED",
    CORE$DRIVER$SSH_TUNNEL_CONN_ERR = "E_CORE_DRIVER_SSH_TUNNEL_CONN_ERR",
    CORE$SHELL$BROKEN_SHELL = "E_CORE_SHELL_BROKEN",
    CORE$MEM_STORE$INVALID_INPUT = "E_CORE_MEM_STORE_INVALID_INPUT",
    CORE$MEM_STORE$NO_ENTRY = "E_CORE_MEM_STORE_NO_ENTRY",
    SCRIPTS$OPEN$INVALID_INPUT = "E_SCRIPTS_OPEN_INVALID_INPUT",
    SCRIPTS$SAVE$NO_ENT = "E_SCRIPTS_SAVE_NO_ENT",
    UTILS$ASYNC_OVERLOAD$INVALID_HANDLER_TYPE = "E_UTILS_ASYNC_OVERLOAD_INVALID_HANDLER_TYPE"
}

export const ERR_MESSAGES = {
    [ERR_CODES.CORE$DRIVER$NO_STORED_CONNECTION]: "Connection is not saved on Ark.",
    [ERR_CODES.CORE$DRIVER$NO_CACHED_CONNECTION]: "Connection is not established.",
    [ERR_CODES.CORE$DRIVER$SSH_TUNNEL_CLOSED]: "SSH tunnel closed.",
    [ERR_CODES.CORE$DRIVER$SSH_TUNNEL_CONN_ERR]: "Unable to make ssh connection.",
    [ERR_CODES.CORE$SHELL$BROKEN_SHELL]: "Invalid shell",
    [ERR_CODES.CORE$MEM_STORE$INVALID_INPUT]: "An error occured when fetching an item from store.",
    [ERR_CODES.CORE$MEM_STORE$NO_ENTRY]: "Item not found in store.",
    [ERR_CODES.SCRIPTS$OPEN$INVALID_INPUT]: "An error occured when fetching the script.",
    [ERR_CODES.SCRIPTS$SAVE$NO_ENT]: "File does not exist. Use the 'Save as' option first.",
    [ERR_CODES.UTILS$ASYNC_OVERLOAD$INVALID_HANDLER_TYPE]: "Invalid type of method passed to asyncEventOverload."
} as const;

export const isValidErrorCode = (code: ERR_CODES | string): code is ERR_CODES => !!ERR_MESSAGES[code as ERR_CODES];

export const getErrorMessageForCode = (code: ERR_CODES) => ERR_MESSAGES[code];
