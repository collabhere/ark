import { Collection, MongoClient, MongoClientOptions } from 'mongodb';
import { connectionStore } from '../stores/connection';

interface Configuration {
    name: string;
    members: Array<String>;
    username?: string;
    password?: string;
    database: string;
}

export const createConnection = async (
    configuration: Configuration,
    options: MongoClientOptions
) => {
    const connection = await MongoClient.connect(
        getConnectionUri(configuration, options),
        options
    );

    return connectionStore()
        .setConnection(configuration.name, connection);
}

const getConnectionUri = ({
    members,
    database = 'admin',
    username,
    password
}: Configuration, options: MongoClientOptions) => {
    const optionsString = Object.entries(options).reduce((prevOption, option) =>
        `${prevOption}?${option[0]}=${option[1]}`, '');

    const auth = username && password ? `${username}:${password}@` : '';
    return `mongodb://${auth}${members.join(',')}/${database || options.authSource}${optionsString}`;
};

export const dbHandler = async (connectionName: string) => {
    try {
        const connection = connectionStore().getConnection(connectionName || 'NewConnection');
        if (connection) {
            const getCollections = async () => (await connection.db().collections())
                .map(coll => coll.collectionName);

            const getDbName = async () => Promise.resolve(connection.options.dbName);

            const getIndexDetails = async (collection: string) => await connection.db()
                .collection(collection).indexes();

            const getReplicaSets = async () => await connection.db().admin()
                .replSetGetStatus();

            return {
                getCollections,
                getIndexDetails,
                getDbName,
                getReplicaSets
            };
        } else {
            return Promise.reject('Connection not found!');
        }

    } catch (e) {
        console.log(e);
        return Promise.reject(e.message || e);
    }
}