import {
	saveNewConnection,
	getAllConnections,
	createConnection,
	getConnectionById,
	getActiveConnections,
	removeActiveConnection,
} from "../helpers/connection";

interface InitParams {
	mongoUri: string;
}

export function init(params: InitParams) {
	// dbHandler()
}

interface SaveParams {
	type: "config" | "uri";
	uri: string;
	name: string;
}

export function saveConnection(params: SaveParams) {
	console.log("create connection getting called", params);
	return saveNewConnection(params.type as "uri", {
		uri: params.uri,
		name: params.name,
	}).then((id) => {
		console.log("printing id", id);
		return id;
	});
}

export function getConnections() {
	return getAllConnections();
}

export function getConnectionDetails(params: { id: string }) {
	return getConnectionById(params.id);
}

interface ConnectionsParam {
	id: string;
}

export function create(params: ConnectionsParam) {
	return createConnection(params.id);
}

export function getActiveConnIds() {
	return Array.from(getActiveConnections());
}

export function disconnect(params: ConnectionsParam) {
	return removeActiveConnection(params.id);
}
