interface Collection {
    find(query: any): any;
}

interface Database {
    getCollection(collectionName: string): Collection;
}

declare const db: Database;
