import { ConnectionHelper } from "../helpers/connection-helper";

const connections = ConnectionHelper();

interface SaveParams<T extends "config" | "uri"> {
	type: T;
	uri: T extends "uri" ? string : undefined;
	name: T extends "uri" ? string : undefined;
	config: T extends "config" ? Ark.StoredConnection : undefined;
}

interface ConnectionsParam {
	id: string;
}

export function saveConnectionFromUri(params: SaveParams<"uri">) {
	return connections.save(params.type, {
		uri: params.uri,
		name: params.name,
	});
}

export function saveConnectionFromConfig(params: SaveParams<"config">) {
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
