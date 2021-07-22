import { createConnection } from "./connection";

(async function testConnection () {
    const connection = await createConnection({
        database: 'klenty_test_3',
        members: ['ec2-3-13-197-203.us-east-2.compute.amazonaws.com:27017'],
        password: 'testdb',
        username: 'testdb'
    }, {});

    const collections = await connection.db().collections();
    console.log(collections[0].collectionName);
}());
