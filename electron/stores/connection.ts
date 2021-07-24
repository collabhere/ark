import { MongoClient } from 'mongodb';

const store = new Map<string, MongoClient>();

export const connectionStore = () => {

    const setConnection = (name: string, connection: MongoClient) => {
        if (name && connection) {
            return store.set(name, connection);            
        }
    }

    const getConnection = (name: string) => {
        if (store.has(name)) {
            return store.get(name);
        }
    }

    const deleteConnection = (name: string) => {
        if (store.has(name)) {
            return store.delete(name);
        }
    }

    return { getConnection, setConnection, deleteConnection }
}