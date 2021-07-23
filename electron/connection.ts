import { MongoClient, MongoClientOptions } from 'mongodb';

interface Configuration {
    members: Array<String>;
    username: string;
    password: string;
    database: string;
}

export const createConnection = (
    configuration: Configuration,
    options: MongoClientOptions
) => {
    return MongoClient.connect(
        getConnectionUri(configuration, options.authSource),
        options
    );
}

 const getConnectionUri = ({
    members,
    database = 'admin',
    username,
    password
}: Configuration, authSource: string | undefined) => new URL(
        `mongodb://${username}:${password}@${members.join(',')}/${authSource || database}`
    ).toString();