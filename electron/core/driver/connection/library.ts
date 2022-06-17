import { MongoClient, MongoClientOptions } from "mongodb";
import type { SrvRecord } from "dns";
import { promises as netPromises } from "dns";
import { nanoid } from "nanoid";
import path from "path";
import mongoUri from "mongodb-uri";
import * as crypto from "crypto";
import tunnel, { Config } from "tunnel-ssh";

import { ARK_FOLDER_PATH } from "../../../utils/constants";
import { Connection } from ".";

export const sshTunnel = async (
    sshConfig: Ark.StoredConnection["ssh"],
    hosts: Array<string>
): Promise<ReturnType<typeof tunnel> | void> => {
    if (!sshConfig) {
        return;
    }

    const host = hosts[0].split(":")[0];
    const port = hosts[0].split(":")[1]
        ? Number(hosts[0].split(":")[1])
        : undefined;

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

export const getConnectionUri = (
    {
        hosts,
        database = "admin",
        username,
        password,
        options,
        iv,
        key
    }: Ark.StoredConnection
) => {
    const uri = mongoUri.format({
        hosts: hosts.map((host) => ({
            host: host.split(":")[0],
            port: host.split(":")[1] ? parseInt(host.split(":")[1]) : undefined,
        })),
        scheme: "mongodb",
        database,
        options,
        username,
        password: (password && key && iv)
            ? decrypt(password, key, iv)
            : password,
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
    config: URIConfiguration | Ark.StoredConnection
): config is URIConfiguration {
    if (type === "uri") return true;
    return false;
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
    client: MongoClient
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
            set: undefined
        }
    }
};

export const encrypt = (password: string) => {
    const iv = crypto.randomBytes(16);
    const key = crypto.randomBytes(32);

    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
    return {
        pwd: Buffer.concat([cipher.update(password), cipher.final()]).toString(
            "hex"
        ),
        key: key.toString("hex"),
        iv: iv.toString("hex"),
    };
};

export const decrypt = (password: string, key: string, iv: string) => {
    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(key, "hex"),
        Buffer.from(iv, "hex")
    );
    return decipher.update(password, "hex", "utf8") + decipher.final("utf8");
};

export const createConnectionConfigurations = async ({
    type,
    config,
}: Parameters<Connection["save"]>[1]): Promise<Ark.StoredConnection> => {
    const options: MongoClientOptions = {};
    let hosts: Array<string>;

    if (isURITypeConfig(type, config)) {
        const id = nanoid();
        const parsedUri = mongoUri.parse(config.uri);
        if (parsedUri.scheme.includes("+srv")) {
            const hostdetails = parsedUri.hosts[0];
            hosts = (await lookupSRV(`_mongodb._tcp.${hostdetails.host}`)).map(
                (record) => `${record.name}:${record.port || 27017}`
            );

            if (hosts && hosts.length > 0) {
                const client = new MongoClient(config.uri);
                const replicaSetDetails = await getReplicaSetDetails(client);

                if (replicaSetDetails && replicaSetDetails.set) {
                    options.replicaSet = replicaSetDetails.set;
                }
            }

            options.tls = true;
            options.tlsCertificateFile = path.join(ARK_FOLDER_PATH, "certs", "ark.crt");
            options.authSource = "admin";
        } else {
            hosts = parsedUri.hosts.map(
                (host) => `${host.host}:${host.port || 27017}`
            );
        }

        const encryption = parsedUri.password
            ? encrypt(parsedUri.password)
            : undefined;

        return {
            id,
            protocol: parsedUri.scheme,
            name: config.name,
            type: hosts.length > 1 ? "replicaSet" : "directConnection",
            hosts: hosts,
            username: parsedUri.username,
            password: encryption?.pwd,
            key: encryption?.key,
            iv: encryption?.iv,
            database: parsedUri.database,
            options: { ...parsedUri.options, ...options },
            ssh: { useSSH: false },
        };
    } else {
        const id = config.id || nanoid();

        if (!config.options.tls) {
            const {
                tls: _,
                tlsCertificateFile: __,
                ...formattedOptions
            } = config.options;
            config.options = { ...formattedOptions };
        } else if (config.options.tls && !config.options.tlsCertificateFile) {
            config.options.tlsCertificateFile = path.join(ARK_FOLDER_PATH, "certs", "ark.crt");
        }

        if (!config.username) {
            const { authMechanism: _, ...opts } = config.options;
            config.options = { ...opts };
        }

        const encryption = config.password ? encrypt(config.password) : undefined;

        config.password = encryption?.pwd;
        config.key = encryption?.key;
        config.iv = encryption?.iv;

        return {
            ...config,
            id,
        };
    }
};
