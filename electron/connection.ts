import { MongoClient, MongoClientOptions } from 'mongodb';
import { connectionStore } from './stores/connections';

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
    console.log(getConnectionUri(configuration, options.authSource));
    const connection = await MongoClient.connect(
        getConnectionUri(configuration, options.authSource),
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
}: Configuration, authSource: string | undefined) => {
        const auth = username && password ? `${username}:${password}@` : '';
        return `mongodb://${auth}${members.join(',')}/${authSource || database}?replicaSet=rs0`;
    };