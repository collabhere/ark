interface Collection {
    find(query: any, projection?: any): Collection;
    limit(limit: number): Collection;
    skip(skip: number): Collection;
    aggregate(pipelines: any[]): Collection;
}

interface CollectionInfo {
    name: string;
    type: string;
    options: any;
    info: {
        uuid: string;
        readOnly: boolean;
    };
    idIndex: any;
}
declare class Db {
    getCollection(collectionName: string): Collection;
    getCollectionInfos(filter?: any, nameOnly?: boolean, authorizedCollections?: boolean): Array<CollectionInfo>;
}

declare const db: Db;
