import { createConnection } from "./connection";
import { connectionStore } from "./stores/connections";

(async function testConnection () {
    await createConnection({
        database: 'testdb',
        members: ['localhost:27017','localhost:27018'],
        name: 'NewConnection'
    }, {});

    const connection = connectionStore().getConnection('NewConnection');

    if (!connection) {
        return Promise.reject('Connection not found!');
    }

    const collections = await connection.db().collections();
    const replicaSets = await connection.db().admin().replSetGetStatus();
    
    console.log(collections[0].collectionName);
}());
