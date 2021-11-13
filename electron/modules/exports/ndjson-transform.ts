import { Transform } from "stream";

const ndjsonFormatter = (chunk: Record<string, any>) =>
	Promise.resolve(JSON.stringify(chunk) + "\n");

export const NDJSONTransform = () => {
	return new Transform({
		objectMode: true,

		transform(
			chunk: Record<string, any>,
			encoding: string,
			callback: (err?: Error, value?: string) => void
		) {
			ndjsonFormatter(chunk)
				.then((res) => {
					callback(undefined, res);
				})
				.catch((err) => {
					callback(err);
				});
		},
	});
};
