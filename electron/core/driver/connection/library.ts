import axios from "axios";
import { Buffer } from "buffer";
import * as crypto from "crypto";
import type { SrvRecord } from "dns";
import { promises as netPromises } from "dns";
import { MongoClient, MongoClientOptions } from "mongodb";
import mongoUri from "mongodb-uri";
import { nanoid } from "nanoid";
import path from "path";
import tunnel, { Config } from "tunnel-ssh";

import { readFile } from "fs/promises";
import { Connection } from ".";
import { ARK_FOLDER_PATH } from "../../../utils/constants";

const ARK_CRT_PATH = path.join(ARK_FOLDER_PATH, "certs", "ark.crt");

export const sshTunnel = async (
	sshConfig: Ark.StoredConnection["ssh"],
	hosts: Ark.StoredConnection["hosts"],
): Promise<ReturnType<typeof tunnel> | void> => {
	if (!sshConfig) {
		return;
	}

	const host = hosts[0].host;
	const port = hosts[0].port;

	const tunnelConfig: Config = {
		username: sshConfig.username,
		host: sshConfig.host,
		port: Number(sshConfig.port),
		dstHost: sshConfig.mongodHost || "127.0.0.1",
		dstPort: Number(sshConfig.mongodPort) || 27017,
		localHost: host || "127.0.0.1",
		localPort: port,
	};

	if (sshConfig.privateKey) {
		tunnelConfig.privateKey = sshConfig.privateKey;
		tunnelConfig.passphrase = sshConfig.passphrase || "";
	} else {
		tunnelConfig.password = sshConfig.password;
	}

	return new Promise((resolve, reject) => {
		tunnel(tunnelConfig, (err, server) => {
			if (err) {
				reject(err);
			}

			resolve(server);
		});
	});
};

export const getConnectionUri = async (
	{ hosts, database = "admin", username, password, options, iv }: Ark.StoredConnection,
	encryptionKey?: Ark.Settings["encryptionKey"],
) => {
	const pwd =
		password && iv && encryptionKey?.value && encryptionKey?.type
			? await decrypt(password, encryptionKey, iv)
			: password;

	const uri = mongoUri.format({
		scheme: "mongodb",
		hosts,
		database,
		// Gets rid of undefined fields because this module
		// was keeping them in the querystring
		options: JSON.parse(JSON.stringify(options)),
		username,
		password: pwd,
	});

	return uri;
};

export const lookupSRV = (connectionString: string): Promise<SrvRecord[]> => {
	return netPromises.resolveSrv(connectionString);
};

export interface URIConfiguration {
	uri: string;
	name: string;
}

export function isURITypeConfig(
	type: "uri" | "config",
	config: URIConfiguration | Ark.StoredConnection,
): config is URIConfiguration {
	return type === "uri";
}

export interface ReplicaSetMember {
	name: string;
	health: number;
	state: number;
	stateStr: "PRIMARY" | "SECONDARY";
}

export interface GetConnectionResult {
	replicaSetDetails?: {
		members: ReplicaSetMember[];
		set: string | undefined;
	};
}

export const getReplicaSetDetails = async (
	client: MongoClient,
): Promise<GetConnectionResult["replicaSetDetails"] | void> => {
	const connection = await client.connect();
	const admin = connection.db().admin();
	try {
		const replSetStatus = await admin.replSetGetStatus();
		const members = replSetStatus.members;
		return {
			members,
			set: replSetStatus.set,
		};
	} catch (err) {
		console.log(err);
		return {
			members: [],
			set: undefined,
		};
	}
};

export const encrypt = async (password: string, encryptionKey?: Ark.Settings["encryptionKey"]) => {
	const key =
		encryptionKey?.type === "url" && encryptionKey?.value
			? (await axios.get(encryptionKey?.value)).data
			: encryptionKey?.value
			? (await readFile(encryptionKey.value)).toString()
			: undefined;

	const iv = crypto.randomBytes(16);
	const cipherKey = crypto.createSecretKey(Buffer.from(key, "hex").toString("hex"), "hex");
	const cipher = crypto.createCipheriv("aes-256-cbc", cipherKey, iv);
	return {
		pwd: password && Buffer.concat([cipher.update(password), cipher.final()]).toString("hex"),
		iv: iv.toString("hex"),
	};
};

export const decrypt = async (password: string, encryptionKey: Ark.Settings["encryptionKey"], iv: string) => {
	try {
		const key =
			encryptionKey?.type === "url" && encryptionKey?.value
				? (await axios.get(encryptionKey?.value)).data
				: encryptionKey?.value
				? await readFile(encryptionKey.value)
				: undefined;

		const secret = crypto.createSecretKey(Buffer.from(key, "hex").toString(), "hex");

		const decipher = crypto.createDecipheriv("aes-256-cbc", secret, Buffer.from(iv, "hex"));
		return decipher.update(password, "hex", "utf8") + decipher.final("utf8");
	} catch (err) {
		console.log("broken_password");
		console.log(err);
		return "";
	}
};

export const createConnectionConfigurations = async (
	{ type, config }: Parameters<Connection["save"]>[1],
	encryptionKey: Ark.Settings["encryptionKey"],
): Promise<Ark.StoredConnection> => {
	const options: MongoClientOptions = {};
	let hosts: Ark.StoredConnection["hosts"] | undefined;

	if (isURITypeConfig(type, config)) {
		const id = nanoid();
		let tlsMethod;

		const parsedUri = mongoUri.parse(config.uri);

		if (parsedUri.scheme.includes("+srv")) {
			const hostdetails = parsedUri.hosts[0];

			hosts = (await lookupSRV(`_mongodb._tcp.${hostdetails.host}`)).map((record) => ({
				host: record.name,
				port: record.port || 27017,
			}));

			if (hosts && hosts.length > 0) {
				const client = new MongoClient(config.uri);

				const replicaSetDetails = await getReplicaSetDetails(client);

				if (replicaSetDetails && replicaSetDetails.set) {
					options.replicaSet = replicaSetDetails.set;
				}
			}

			if (parsedUri.options) {
				const { tls, tlsCertificateFile, authSource } = parsedUri.options;

				if (!authSource) {
					options.authSource = "admin";
				}

				// if the uri requests tls and doesn't provide a certificate path
				// we use a self-signed certificate.
				if (tls && !tlsCertificateFile) {
					tlsMethod = "self-signed" as const;
					options.tlsCertificateFile = ARK_CRT_PATH;
				}
			}
		} else {
			hosts = parsedUri.hosts.map((host) => ({
				host: host.host,
				port: host.port || 27017,
			}));
		}

		const encryption = parsedUri.password ? await encrypt(parsedUri.password, encryptionKey) : undefined;

		return {
			id,
			protocol: parsedUri.scheme,
			name: config.name,
			type: hosts.length > 1 ? "replicaSet" : "directConnection",
			hosts: hosts,
			username: parsedUri.username,
			password: encryption?.pwd,
			iv: encryption?.iv,
			database: parsedUri.database,
			options: { ...parsedUri.options, ...options },
			ssh: { useSSH: false },
			tlsMethod: tlsMethod,
		};
	} else {
		const id = config.id || nanoid();

		if (config.options.tls && config.tlsMethod === "self-signed") {
			config.options.tlsCertificateFile = ARK_CRT_PATH;
		}

		if (!config.username) {
			const { authMechanism: _, ...opts } = config.options;
			config.options = { ...opts };
		}

		const encryption = config.password ? await encrypt(config.password, encryptionKey) : undefined;

		return {
			...config,
			password: encryption?.pwd,
			iv: encryption?.iv,
			id,
		};
	}
};
