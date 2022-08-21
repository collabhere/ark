import { Transform } from "stream";

const ndjsonFormatter = (chunk: Record<string, any>) => JSON.stringify(chunk) + "\n";

export const NDJSONTransform = () => {
	return new Transform({
		objectMode: true,

		transform(chunk: Record<string, any>, encoding: string, callback: (err?: Error, value?: string) => void) {
			try {
				const json = ndjsonFormatter(chunk);
				callback(undefined, json);
			} catch (err: any) {
				callback(err);
			}
		},
	});
};
