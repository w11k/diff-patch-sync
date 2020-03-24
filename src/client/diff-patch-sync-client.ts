import {Config, Delta} from "jsondiffpatch";
import * as _ from 'lodash'
import {v1} from "uuid";
import {
    ClientDoc,
    DiffPatchSyncConstraints,
    Edit,
    EditsDTO, LocalStoreAdapter,
} from "../core/diff-patch-sync-interfaces";
import {DiffPatchSyncHelper} from "../core/diff-patch-sync-helper";
import {Observable, ReplaySubject} from "rxjs";
import {map} from "rxjs/operators";

/*
*    This will create a new client.
*
*    @typeparam T                               The type parameter 'T' is generic, so pass your own interface/class for type safety.
*    @param syncWithRemoteCallback              The 'syncWithRemoteCallback' parameter is the callback function for the api call to the rest backend.
*    @param dataAdapter                         The 'dataAdapter' parameter is the persistence adapter for local storage
*    @param diffPatchOptions                    The 'diffPatchOptions' parameter is optional and you can pass your own options for the diff patch
*                                               algorithm (see https://github.com/benjamine/jsondiffpatch#options)
*/
export class DiffPatchSyncClient<T extends DiffPatchSyncConstraints> {

    syncWithRemoteCallback: (editMessage: EditsDTO) => Promise<EditsDTO>;
    dataAdapter: LocalStoreAdapter<T>;
    diffPatchSyncHelper: DiffPatchSyncHelper<T>;

    isSyncing: boolean = false;
    initialized: boolean = false;
    doc: ClientDoc<T> = this.initDoc();
    triggerChange: ReplaySubject<any> = new ReplaySubject<any>(1);

    constructor(
        syncWithRemoteCallback: (editMessage: EditsDTO) => Promise<EditsDTO>,
        dataAdapter: LocalStoreAdapter<T>,
        private diffPatchOptions: Config = undefined,
    ) {
        this.syncWithRemoteCallback = syncWithRemoteCallback;
        this.dataAdapter = dataAdapter;
        this.diffPatchSyncHelper = new DiffPatchSyncHelper(diffPatchOptions);
    }

    /*
    *    The clients needs to be initialized with the 'initData' function with data before usage to init the doc
    *
    */
    async initData(): Promise<any> {
        this.initialized = true;
        const localData: ClientDoc<T> = await this.dataAdapter.getLocalData();

        if (localData) {
            this.doc = localData;
        } else {
            this.doc = this.initDoc();
            return await this.dataAdapter.storeLocalData(this.doc);
        }
    }

    /*
    *    If you want to update an existing entry of the data use 'update' function.
    *
    *    @param toUpdateItem    The 'toUpdateItem' parameter should be an existing entry from the clients document state.
    *    @param updatedItem     The 'updatedItem' parameter should be updated entry which will be committed to the clients document state.
    *
    */
    update(toUpdateItem: T, updatedItem: T): void {
        this.doc.localCopy = this.doc.localCopy.map((item: T) => item == toUpdateItem ? _.cloneDeep(updatedItem) : item);
        this.triggerChange.next();
    }

    /*
    *    If you want to update an existing entry by id of the data use 'updateById' function.
    *
    *    @param id              The 'id' parameter should be an existing id from an entry from the clients document state.
    *    @param updatedItem     The 'updatedItem' parameter should be updated entry which will be committed to the clients document state.
    *
    */
    updateById(id: string, updatedItem: T): void {
        this.doc.localCopy = this.doc.localCopy.map((item: T) => item.id == id ? _.cloneDeep(updatedItem) : item);
        this.triggerChange.next();
    }

    /*
    *    If you want to add a new entry to your data use 'create' function.
    *
    *    @param item        The 'docItem' parameter type should be the same a the type parameter you passed before on creating the client.
    *
    */
    create(docItem: T): void {
        this.doc.localCopy.push(_.cloneDeep(docItem));
        this.triggerChange.next();
    }

    /*
    *    If you want to remove an existing entry of the data use 'remove' function.
    *
    *    @param docItem       The 'docItem' parameter should be an existing entry from the clients document state.
    *
    */
    remove(docItem: T): void {
        this.doc.localCopy = this.doc.localCopy.filter((item: T) => item !== docItem);
        this.triggerChange.next();
    }

    /*
    *    If you want to remove an existing entry by id of the data use 'removeById' function.
    *
    *    @param id      The 'id' parameter should be an id which will be compared to entries in the clients document state.
    *
    */
    removeById(id: string): void {
        this.doc.localCopy = this.doc.localCopy.filter((item: T) => item.id !== id);
        this.triggerChange.next();
    }

    /*
    *    If you want to receive changes when the document is being updated call 'subscribeToChanges'
    *
    *    @returns       Returns an Observable of the client document state every time a change is triggered and after each sync cycle.
    *
    */
    subscribeToChanges(): Observable<T[]> {
        return this.triggerChange.pipe(
            map(_ => this.doc.localCopy)
        )
    }

    /*
    *    Sync data periodically with remote. 'syncPeriodically' function must be called once.
    *
    *    @param delay      The 'delay' parameter is the delay between the sync cycles.
    *
    */
    syncPeriodically(delay: number): void {
        this.sync().then(_ => {
            new Promise((resolve) => setTimeout(resolve,delay)).then(_ => {
                this.syncPeriodically(delay);
            });
        });
    }

    /*
    *    Sync data once with remote. 'sync' function must be called every time the document state has changed.
    *
    *    @returns       Returns a Promise of the new synced client document state after a sync cycle.
    */
    async sync(): Promise<T[]> {

        if (!this.initialized) {
            console.error(`Client not initialized, use 'client.initData()' before!`);
        }

        if (this.isSyncing) {
            // return and and patch changes on the next sync cycle (can occur on slow networks)
            return await this.handleError({message: 'ONLY_ONE_SYNC_CYCLE_ERROR: only one sync cycle! Changes will be patched on next cycle'});
        }

        try {
            this.isSyncing = true;

            const diff: Delta = this.diffPatchSyncHelper.createDiff(this.doc.localShadow.shadowCopy, this.doc.localCopy);
            const basedOnLocalVersion = this.doc.localShadow.localVersion;

            if (!_.isEmpty(diff)) {
                this.doc.edits.push(this.diffPatchSyncHelper.createEdit(diff, this.doc.localShadow.remoteVersion, basedOnLocalVersion));
                this.doc.localShadow.localVersion++;
                await this.dataAdapter.updateLocalData(this.doc);
            }

            this.doc.localShadow.shadowCopy = this.diffPatchSyncHelper.patchInto(this.doc.localShadow.shadowCopy, diff);

            const clientMessage: EditsDTO = this.diffPatchSyncHelper.createMessage(this.doc.edits, this.doc.localShadow.remoteVersion, basedOnLocalVersion, this.doc.localShadow.clientReplicaId);
            const serverMessage: EditsDTO = await this.syncWithRemoteCallback(clientMessage);

            if (serverMessage && serverMessage.localVersion === this.doc.localShadow.localVersion) {
                if (this.doc.edits.length !== 0) {
                    this.doc.edits = [];
                    await this.dataAdapter.updateLocalData(this.doc);
                }
                if (serverMessage.edits.length !== 0) {
                    serverMessage.edits.forEach((edit: Edit) => this.applyDiffs(edit));
                    await this.dataAdapter.updateLocalData(this.doc);
                }
            } else {
                console.log('REJECTED_PATCH: because localVersions don\'t match. Please clear storage!');
                return await this.handleError({message: 'REJECTED_PATCH: because localVersions don\'t match'});
            }

        } catch (e) {
            return await this.handleError(e)
        } finally {
            this.isSyncing = false;
            this.triggerChange.next();
        }
        return this.doc.localCopy;
    }

    async handleError(error): Promise<T[]> {
        console.info(`Syncing to remote failed because of: ${error.message}`);
        await this.dataAdapter.updateLocalData(this.doc);
        return this.doc.localCopy;
    }

    applyDiffs(serverEdit: Edit): void {
        if (serverEdit.localVersion === this.doc.localShadow.localVersion &&
            serverEdit.remoteVersion === this.doc.localShadow.remoteVersion) {

            if (serverEdit.diff) {
                this.doc.localShadow.shadowCopy = this.diffPatchSyncHelper.patchInto(this.doc.localShadow.shadowCopy, serverEdit.diff);
                this.doc.localCopy = this.diffPatchSyncHelper.patchInto(this.doc.localCopy, serverEdit.diff);
                this.doc.localShadow.remoteVersion++;
            }
        }
    }

    private initDoc(): ClientDoc<T> {
           return {
                localShadow: {
                    shadowCopy: [],
                    clientReplicaId: v1(),
                    remoteVersion: 0,
                    localVersion: 0,
                },
                edits: [],
                localCopy: [],
            };
    }
}
