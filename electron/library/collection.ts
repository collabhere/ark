import { Collection, MongoClient, MongoClientOptions } from 'mongodb';

function checkActiveConnection(username: string) {
    // if(username) { //Check for active conn
    //     let conn; //Fetch connection from the store
    //     return conn;
    // } else {
    //     //Retry connection
    //     let newConnection = MongoClient.connect('');
    //     return newConnection;
    // }
    return MongoClient.connect('');
}

function successHandler(data: any) { 
    //Build a success handler
}

function errorHandler(err: any) {
    //Decide structure for error handler
}


export function list(args: Record<string, any>) {
    //Check if we have an active connection stored under this username
    return checkActiveConnection(args.username)
    .then((connection) => {
        return connection.db().collections()
            // .then((data) => data.map((collection) => collection.collectionName))
            // .then((data) => successHandler(data))
            // .catch((err) => errorHandler(err));
    })
}

export function renameCollection(args: Record<string, any>) {
    return checkActiveConnection(args.username)
    .then((connection) => {
        return connection.db().renameCollection(args.collection, args.newCollectionName, args.options)
            //.then((data) => successHandler(data))
            //.catch((err) => errorHandler(err));
    })
}

export function dropCollection(args: Record<string, any>) { 
    return checkActiveConnection(args.username)
        .then((connection) => {
            return connection.db().dropCollection(args.collection, args.options)
            //.then((data) => successHandler(data))
            //.catch((err) => errorHandler(err));
        });
}

export function printRandom(args: Record<string, any>) {
    console.log('args', args);
    return Promise.resolve(args.username);
}