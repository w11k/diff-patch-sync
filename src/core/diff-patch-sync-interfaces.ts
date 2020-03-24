import {Delta} from "jsondiffpatch";

export interface DiffPatchSyncConstraints {
    id: string;
}

export interface ClientDoc<T> {
    localCopy: T[];
    localShadow: Shadow<T>;
    edits: Edit[];
}

export interface ServerDoc<T> {
    serverCopy: T[],
    shadowSet: Shadow<T>[];
}

export interface Shadow<T> {
    localVersion: number;
    remoteVersion: number;
    clientReplicaId: string;
    shadowCopy: T[];
}

export interface Edit {
    remoteVersion: number;
    localVersion: number;
    diff: Delta;
}

export interface EditsDTO {
    clientReplicaId: string;
    edits: Edit[];
    localVersion: number;
    remoteVersion: number;
}

export interface LocalStoreAdapter<T> {
    storeLocalData(document: ClientDoc<T>): Promise<any>;

    /*
    *    In order to persist the current clients document state before and after syncing with the backend, the
    *    'storeLocalData' callback function will be called if defined.
    *
    *    @param document     The 'document' parameter contains the hole document with the
    *    clients local data copy, the client data shadow, all version numbers and the unique replica id
    */
    getLocalData(): Promise<ClientDoc<T>>;
    updateLocalData(document: ClientDoc<T>): Promise<any>;
}

export interface PersistenceAdapter<T> {

    findAllShadows(): Promise<Shadow<T>[]>;
    findShadowById(clientReplicaId: string): Promise<Shadow<T>>;
    saveShadow(shadow: Shadow<T>): Promise<any>;
    updateShadow(shadow: Shadow<T>): Promise<any>;
    deleteShadow(shadow: Shadow<T>): Promise<any>;

    findAllItems(): Promise<T[]>;
    saveItem(item: T): Promise<any>;
    updateItem(item: T): Promise<any>;
    deleteItem(item: T): Promise<any>;
    /*
    *    In order to persist a new shadow when a new client connects the `executeShadowOperation` callback function will be called if defined.
    *
    *    @param operation     The `operation` parameter contains the clients shadow
    *    @returns          Should return a Promise after db-operation
    */
    // executeShadowOperation(op: EntityOperation<Shadow<T>>): Promise<any>;

    /*
    *    In order to update or add new entries to the main entity when the `sync` function is called the `executeEntityOperation` callback function will be called if defined.
    *
    *    @param item       The `item` parameter contains an array of entries of the main entity
    *    @returns          Should return a Promise when updated/saved
    */
    // executeEntityOperation(op: EntityOperation<T>): Promise<any>;
}