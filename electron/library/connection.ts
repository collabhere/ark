import { ConnectionHelper } from "../helpers/connection-helper";

const connections = ConnectionHelper();

interface SaveParams {
	type: "config" | "uri";
	uri: string;
	name: string;
}

interface ConnectionsParam {
	id: string;
}

export function saveConnection(params: SaveParams) {
	return connections.save(params.type as "uri", {
		uri: params.uri,
		name: params.name,
	});
}

export function getConnections() {
	return connections.list();
}

export function getConnectionDetails(params: { id: string }) {
	return connections.get(params.id);
}

export function create(params: ConnectionsParam) {
	return connections.connect(params.id);
}

export function disconnect(params: ConnectionsParam) {
	return connections.disconnect(params.id);
}

export function deleteConnection(params: ConnectionsParam) {
	return connections.delete(params.id);
}
