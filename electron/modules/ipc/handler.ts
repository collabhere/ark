import { IpcMainInvokeEvent } from "electron";

export interface IPCHandle {
	(event: IpcMainInvokeEvent, data: any): Promise<any>;
}

export interface IPCHandlerOptions<ArgType, ReturnType> {
	channel: string;
	controller: (args: ArgType) => Promise<ReturnType>;
	onEventLog?: (args: ArgType) => string;
}

export function ipcHandlers<ArgType, ReturnType = any>({
	channel,
	controller,
	onEventLog,
}: IPCHandlerOptions<ArgType, ReturnType>): [string, IPCHandle] {
	const handle: IPCHandle = async (event, data) => {
		console.log(`[${channel}] ${onEventLog ? onEventLog(data) : `data=${JSON.stringify(data).slice(0, 256)}`}`);

		try {
			const result = await controller(data);
			return result;
		} catch (err) {
			console.log(err);
			return { err };
		}
	};

	return [channel, handle];
}
