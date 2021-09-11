import { ConnectionHelper } from "../helpers/connection-helper";

const connections = ConnectionHelper();

interface SaveUriParams {
	type: "uri";
	uri: string;
	name: string;
}

interface SaveConfigParams {
	type: "config";
	config: Ark.StoredConnection;
}

interface ConnectionsParam {
	id: string;
}

export function saveConnectionFromUri(params: SaveUriParams) {
	return connections.save(params.type, {
		uri: params.uri,
		name: params.name,
	});
}

export function saveConnectionFromConfig(params: SaveConfigParams) {
	return connections.save(params.type, params.config);
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
