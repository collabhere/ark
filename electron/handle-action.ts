import * as collection from "./library/collection";

const libImports: Record<string, any> = {
	'collection': collection,
	'index': 'index file path',
}

export default function handleAction(lib: string, func: string, args: Record<string, any>) {
	return libImports[lib][func](args);
}