const { contextBridge, ipcRenderer } = require('electron')

function invoke(args: Record<string, any>) {
    return ipcRenderer.invoke('handleAll', {...args});
}

export default contextBridge.exposeInMainWorld(
  'ark',
  {
    //We can add definitely add more function calls to store 
    random: {
        print: () => {
            return invoke({
                library: 'collection',
                action: 'printRandom',
                args: {
                    username: 'divij'
                }
            })
        }
    },
    collection: {
        list: (username: string) => {
            return invoke({
                library: 'collection',
                action: 'listCollections',
                args: {
                    username
                }
            });
        },
        renameCollection: (username: string, collection: string, newCollectionName: string, options: Record<string, string | boolean>) => {
            return invoke({
                library: 'collection',
                action: "renameCollection",
                args: {
                    username,
                    collection,
                    newCollectionName,
                    options
                }
            });
        },
        dropCollection: (username: string, collection: string, options: Record<string, string | boolean>) => {
            return invoke({
                library: 'collection',
                action: 'dropCollection',
                args: {
                    username, 
                    collection,
                    options
                }
            });
        },
        cloneCollection: (username: string, collection: string, newCollectionName: Record<string, string | boolean>) => {
            return invoke({
                library: 'collection',
                action: 'cloneCollection',
                args: {
                    username,
                    collection,
                    newCollectionName
                }
            });
        },
        removeAllDocs: (username: string, collection: string) => {
            return invoke({
                library: 'collection',
                action: 'removeAll',
                args: {
                    username,
                    collection
                }
            });
        }
    },
    index: {
        getIndexes: (username: string, collection: string) => {
            //If you wanna get index name, you'll still have to fetch all the index data and then filter out index names from there and return those.
            return invoke({
                library: 'index',
                action: 'getIndex',
                args: {
                    username,
                    collection
                }
            });
        },
        createIndex: (username: string, collection: string, keys: Record<string, number>, options: Record<string, string | boolean>) => {
            return invoke({
                library: 'index',
                action: 'createIndex',
                args: {
                    username,
                    collection,
                    keys,
                    options
                }
            });
        },
        dropIndex: (username: string, collection: string, indexName: string) => {
            //Add another field if we wanna give option to pass in the keys of the index as well.
            return invoke({
                library: 'index',    
                action: 'dropIndex',
                args: {
                    username,
                    collection,
                    indexName
                }
            });
        }
    },
    admin: {
        createUser: (username: string, newUsername: string, password: string, database: string, roles: Array<Record<string, string>>) => {
            return invoke({
                library: 'admin',
                action: 'createUser',
                args: {
                    username, 
                    database,
                    newUsername,
                    password,
                    roles
                }   
            });
        },
    },
    database: {
        repairDatabase: (username: string, database: string) => {
            //Create database backup first before repairing
            return invoke({
                library: 'database',
                action: 'repairDatabase',
                args: {
                    username,
                    database
                }
            });
        },
        dropDatabase: (username: string, database: string) => {
            return invoke({
                library: 'database',
                action: 'dropDatabase',
                args: {
                    username,
                    database
                }
            });
        }
    }
  }
)
