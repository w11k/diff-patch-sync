import {of, throwError} from "rxjs";
import {Config} from "jsondiffpatch";
import {delay} from "rxjs/operators";
import {v1} from "uuid";
import {DiffPatchSyncClient} from "../client/diff-patch-sync-client";
import {ClientDoc, EditsDTO, LocalStoreAdapter} from "../core/diff-patch-sync-interfaces";
import * as _ from "lodash";

describe('DiffPatchSyncClient', async () => {
    let client: DiffPatchSyncClient<any>;
    const dataAdapterMock: LocalStoreAdapter<any> = {
        async getLocalData(): Promise<ClientDoc<any>> {
            return await Promise.resolve(_.cloneDeep(mutableDoc));
        },
        async storeLocalData(document: ClientDoc<any>): Promise<any> {
            return await Promise.resolve(mutableDoc = document)
        },
        async updateLocalData(document: ClientDoc<any>): Promise<ClientDoc<any>> {
            return await Promise.resolve(mutableDoc = document);
        },
    };

    const syncWithRemoteCallbackDummy = async (editMessage: EditsDTO): Promise<EditsDTO> => {
        return await {} as EditsDTO;
    };

    const emptyDoc: ClientDoc<any> = {
        localShadow: {
            shadowCopy: [],
            clientReplicaId: undefined,
            remoteVersion: 0,
            localVersion: 0,
        },
        edits: [],
        localCopy: [],
    };
    const initialDoc: ClientDoc<any> = {
        "localShadow": {
            "clientReplicaId": '2e8ded10-3d2c-11ea-91ec-fdsfsfdsfsfsd',
            "localVersion": 37,
            "remoteVersion": 12,
            "shadowCopy": [
                {
                    "id": "2e8ded10-3d2c-11ea-91ec-af2b74427547",
                    "title": "Item 1",
                    "complete": false,
                    "createdAt": "2020-01-22T15:30:55.713Z",
                    "updatedAt": "2020-01-23T17:47:59.852Z"
                }, {
                    "title": "Item 2",
                    "id": "6ea9eba0-3deb-11ea-9820-ff0194468160",
                    "complete": false,
                    "updatedAt": "2020-01-23T17:48:04.950Z",
                    "createdAt": "2020-01-23T14:19:57.146Z"
                }, {
                    "title": "Item 3",
                    "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                    "complete": false,
                    "updatedAt": "2020-01-23T17:48:09.000Z",
                    "createdAt": "2020-01-23T15:26:46.696Z"
                }, {
                    "title": "Item 4",
                    "id": "6e51fc10-3df5-11ea-9d84-2d877c7d0dce",
                    "complete": false,
                    "updatedAt": "2020-01-23T17:48:12.193Z",
                    "createdAt": "2020-01-23T15:31:31.537Z"
                }
            ]
        },
        "localCopy": [{
            "id": "2e8ded10-3d2c-11ea-91ec-af2b74427547",
            "title": "Item 1",
            "complete": false,
            "createdAt": "2020-01-22T15:30:55.713Z",
            "updatedAt": "2020-01-23T17:47:59.852Z"
        }, {
            "title": "Item 2",
            "id": "6ea9eba0-3deb-11ea-9820-ff0194468160",
            "complete": false,
            "updatedAt": "2020-01-23T17:48:04.950Z",
            "createdAt": "2020-01-23T14:19:57.146Z"
        }, {
            "title": "Item 3",
            "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
            "complete": false,
            "updatedAt": "2020-01-23T17:48:09.000Z",
            "createdAt": "2020-01-23T15:26:46.696Z"
        }, {
            "title": "Item 4",
            "id": "6e51fc10-3df5-11ea-9d84-2d877c7d0dce",
            "complete": false,
            "updatedAt": "2020-01-23T17:48:12.193Z",
            "createdAt": "2020-01-23T15:31:31.537Z"
        }],
        "edits": []
    };
    let mutableDoc: ClientDoc<any>;

    const diffPatchOptions: Config = {
        objectHash: (item: any, index: number) => {
            // try to find the id property
            return item.id;
        }
    };

    beforeEach(async () => {
        client = new DiffPatchSyncClient<any>(syncWithRemoteCallbackDummy, dataAdapterMock);
        mutableDoc = _.cloneDeep(initialDoc);
        await client.initData();
        expect(client.doc.localCopy).toEqual(client.doc.localShadow.shadowCopy);
        expect(client.doc.localShadow.localVersion).toBe(37);
        expect(client.doc.localShadow.remoteVersion).toBe(12);
    });

    describe('constructor()', async () => {
        it('should be initiated with all options after being created', () => {
            client = new DiffPatchSyncClient<any>(syncWithRemoteCallbackDummy, dataAdapterMock, diffPatchOptions);
            expect(client).toBeTruthy();
            expect(client.isSyncing).toBe(false);
            expect(client.doc.localCopy).toEqual(emptyDoc.localShadow.shadowCopy);
            expect(client.doc.edits).toEqual(emptyDoc.edits);
            expect(client.doc.localShadow.localVersion).toEqual(emptyDoc.localShadow.localVersion);
            expect(client.doc.localShadow.remoteVersion).toEqual(emptyDoc.localShadow.remoteVersion);
            expect(client.doc.localShadow.shadowCopy).toEqual(emptyDoc.localShadow.shadowCopy);
            expect(client.diffPatchOptions).toBe(diffPatchOptions);
            expect(client.diffPatchSyncHelper).toBeTruthy();
            expect(client.syncWithRemoteCallback).toBe(syncWithRemoteCallbackDummy);
            expect(client.dataAdapter).toBe(dataAdapterMock);
        });

        it('should be initiated with no options after being created (sync callback is not optional)', async () => {
            client = new DiffPatchSyncClient<any>(syncWithRemoteCallbackDummy, dataAdapterMock);
            expect(client).toBeTruthy();
            expect(client.isSyncing).toBe(false);
            expect(client.doc.localCopy).toEqual(emptyDoc.localShadow.shadowCopy);
            expect(client.doc.edits).toEqual(emptyDoc.edits);
            expect(client.doc.localShadow.localVersion).toEqual(emptyDoc.localShadow.localVersion);
            expect(client.doc.localShadow.remoteVersion).toEqual(emptyDoc.localShadow.remoteVersion);
            expect(client.doc.localShadow.shadowCopy).toEqual(emptyDoc.localShadow.shadowCopy);
            expect(client.diffPatchOptions).not.toBeDefined();
            expect(client.diffPatchSyncHelper).toBeTruthy();
            expect(client.syncWithRemoteCallback).toBe(syncWithRemoteCallbackDummy);
            expect(client.dataAdapter).toBe(dataAdapterMock);
        });
    });

    describe('initData()', () => {
        it('should initialize the doc with a deep clone of initial data', async () => {
            await client.initData();
            expect(client.doc).toEqual(initialDoc);
            expect(client.doc).not.toBe(initialDoc);
        });
        it('should initialize doc with initial values', async () => {
            await client.initData();
            expect(client.doc).toEqual(initialDoc);
        });
    });

    describe('update()', () => {
        it('should exchange the to be updated item by a deep cloned updated item in the local copy', () => {
            const toUpdateItem = client.doc.localCopy
                .filter(item => item.id === '2e8ded10-3d2c-11ea-91ec-af2b74427547')
                .reduce((previousValue, currentValue) => currentValue);
            const expectedItemToBeUpdated = {
                "id": "2e8ded10-3d2c-11ea-91ec-af2b74427547",
                "title": "Item 1 changed",
                "complete": false,
                "createdAt": "2020-01-22T15:30:55.713Z",
                "updatedAt": "2020-01-23T17:47:59.852Z"
            };

            client.update(toUpdateItem, expectedItemToBeUpdated);

            const updatedItem = client.doc.localCopy
                .filter(item => item.id === '2e8ded10-3d2c-11ea-91ec-af2b74427547')
                .reduce((previousValue, currentValue) => currentValue)
            expect(updatedItem).not.toBe(expectedItemToBeUpdated);
            expect(updatedItem).toEqual(expectedItemToBeUpdated);
            expect(updatedItem).not.toBe(toUpdateItem);
        });
    });

    describe('updateById()', () => {
        it('should exchange the to be updated item by id in the local copy', () => {

            const expectedItemToBeUpdated = {
                "id": "2e8ded10-3d2c-11ea-91ec-af2b74427547",
                "title": "Item 1 changed",
                "complete": false,
                "createdAt": "2020-01-22T15:30:55.713Z",
                "updatedAt": "2020-01-23T17:47:59.852Z"
            };

            client.updateById(expectedItemToBeUpdated.id, expectedItemToBeUpdated);

            const updatedItem = client.doc.localCopy
                .filter(item => item.id === '2e8ded10-3d2c-11ea-91ec-af2b74427547')
                .reduce((previousValue, currentValue) => currentValue);

            expect(updatedItem).not.toBe(expectedItemToBeUpdated);
            expect(updatedItem).toEqual(expectedItemToBeUpdated);
        });
    });

    describe('read()', () => {
        it('should return a shallow clone of the local copy', () => {
            const localCopy = client.read();

            expect(localCopy).not.toBe(initialDoc.localCopy);
            expect(localCopy).toEqual(initialDoc.localCopy);
        });
    });

    describe('create()', () => {
        it('should add a new deep cloned item to the local copy', () => {
            const newItem = {
                "id": "2e8dex20-3d2c-11ea-91ec-af2b74427547",
                "title": "Item 5",
                "complete": false,
                "createdAt": "2020-01-22T15:30:55.713Z",
                "updatedAt": "2020-01-23T17:47:59.852Z"
            };

            client.create(newItem);

            const addedItem = client.doc.localCopy
                .filter(item => item.id === '2e8dex20-3d2c-11ea-91ec-af2b74427547')
                .reduce((previousValue, currentValue) => currentValue);

            expect(addedItem).not.toBe(newItem);
            expect(addedItem).toEqual(newItem);
        });
    });

    describe('remove()', () => {
        it('should remove an item from the local copy', () => {
            const itemToBeDeleted = client.doc.localCopy
                .filter(item => item.id === '2e8ded10-3d2c-11ea-91ec-af2b74427547')
                .reduce((previousValue, currentValue) => currentValue);

            client.remove(itemToBeDeleted);

            const deletedItem = client.doc.localCopy
                .filter(item => item.id === '2e8ded10-3d2c-11ea-91ec-af2b74427547')
                .reduce((previousValue, currentValue) => currentValue, undefined);

            expect(deletedItem).toBe(undefined);
        });
    });

    describe('removeById()', () => {
        it('should remove an item by id from the local copy', () => {
            const itemIdToBeDeleted = '2e8ded10-3d2c-11ea-91ec-af2b74427547';

            client.removeById(itemIdToBeDeleted);

            const deletedItem = client.doc.localCopy
                .filter(item => item.id === itemIdToBeDeleted)
                .reduce((previousValue, currentValue) => currentValue, undefined);

            expect(deletedItem).toBe(undefined);
        });
    });

    describe('sync()', async () => {

        describe('Case 1. Normal operation: add an item to the local copy and sync with the server WITHOUT a serverside diff -> localVersion from response and from document IS matching', async () => {
            it('should increase the version number of the local version, apply the patch into the shadow, empty the edit stack. Server version should be the same as before', async () => {
                const newItem = {
                    "id": "2e8dex20-3d2c-11ea-91ec-af2b74427547",
                    "title": "Item 5",
                    "complete": false,
                    "createdAt": "2020-01-22T15:30:55.713Z",
                    "updatedAt": "2020-01-23T17:47:59.852Z"
                };
                const serverResponse: EditsDTO = {
                    "clientReplicaId": "d41529d0-3e1a-11ea-aa47-590e5674016b",
                    "edits": [],
                    "localVersion": 38,
                    "remoteVersion": 12
                };
                spyOn(client, 'syncWithRemoteCallback').and.returnValue(of(serverResponse).toPromise());
                spyOn(client, 'applyDiffs').and.callThrough();
                spyOn(client, 'handleError').and.callThrough();

                client.create(newItem);

                const syncedDoc = await client.sync();

                expect(client.doc.localShadow.localVersion).toBe(38);
                expect(client.doc.localShadow.remoteVersion).toBe(12);
                expect(client.doc.localShadow.shadowCopy).toEqual(syncedDoc);
                expect(client.doc.edits.length).toBe(0);
                expect(client.applyDiffs).not.toHaveBeenCalled();
                expect(client.handleError).not.toHaveBeenCalled();
            });
        });

        describe('Case 2. Normal operation: add an item to the local copy and sync with the server WITH a serverside diff. In between the server has changes it contains and edit in the response -> localVersion and remoteVersion from response and from document ARE matching', async () => {
            it('should increase the version number of the local version and apply the patch into the shadow.' +
                'Due to the matching local version numbers the server edits will be applied to the local copy and the shadow and, the edit stack will be emptied and the server version number incremented', async () => {

                const newItem = {
                    "id": "2e8dex20-3d2c-11ea-91ec-af2b74427547",
                    "title": "Item 5",
                    "complete": false,
                    "createdAt": "2020-01-22T15:30:55.713Z",
                    "updatedAt": "2020-01-23T17:47:59.852Z"
                };
                const serverResponse: EditsDTO = {
                    "clientReplicaId": "d41529d0-3e1a-11ea-aa47-590e5674016b",
                    "edits": [{
                        "remoteVersion": 12,
                        "localVersion": 38,
                        "diff": {
                            "b0e4e550-40e9-11ea-9223-f52bb709b5ad": [{
                                "title": "item 6",
                                "id": "b0e4e550-40e9-11ea-9223-f52bb709b5ad",
                                "complete": false,
                                "updatedAt": "2020-01-27T09:45:02.757Z",
                                "createdAt": "2020-01-27T09:45:02.757Z"
                            }]
                        }
                    }],
                    "localVersion": 38,
                    "remoteVersion": 12
                };
                const expectedServerItem = {
                    "title": "item 6",
                    "id": "b0e4e550-40e9-11ea-9223-f52bb709b5ad",
                    "complete": false,
                    "updatedAt": "2020-01-27T09:45:02.757Z",
                    "createdAt": "2020-01-27T09:45:02.757Z"
                };

                spyOn(client, 'syncWithRemoteCallback').and.returnValue(of(serverResponse).toPromise());
                spyOn(client, 'applyDiffs').and.callThrough();
                spyOn(client, 'handleError').and.callThrough();

                client.create(newItem);

                const syncedDoc = await client.sync();
                const newDocInsertedItemFromServer = client.doc.localCopy
                    .filter(item => item.id === 'b0e4e550-40e9-11ea-9223-f52bb709b5ad')
                    .reduce((previousValue, currentValue) => currentValue, undefined);

                expect(newDocInsertedItemFromServer).toEqual(expectedServerItem);
                expect(client.doc.localShadow.localVersion).toBe(38);
                expect(client.doc.localShadow.remoteVersion).toBe(13);
                expect(client.doc.localShadow.shadowCopy).toEqual(syncedDoc);
                expect(client.doc.edits.length).toBe(0);
                expect(client.handleError).not.toHaveBeenCalled();
                expect(client.applyDiffs).toHaveBeenCalledTimes(1);
            });
        });

        describe('Case 3. Duplicate packet: client triggers a new sync cycle, BEFORE the running roundtrip has been finished', async () => {
            const newItem = {
                "id": "2e8dey30-3d2c-11ea-91ec-af2b74427547",
                "title": "Item 6",
                "complete": true,
                "createdAt": "2020-01-22T15:30:55.713Z",
                "updatedAt": "2020-01-23T17:47:59.852Z"
            };

            beforeEach(function () {
                jasmine.clock().install();
            });
            afterEach(function () {
                jasmine.clock().uninstall();
            });

            it('should run the sync function twice with a delay. The second run must be aborted: after this the added item must be in the local copy, but not in the shadow', async () => {
                const serverResponse: EditsDTO = {
                    "clientReplicaId": "d41529d0-3e1a-11ea-aa47-590e5674016b",
                    "edits": [],
                    "localVersion": 38,
                    "remoteVersion": 12
                };

                let delay = (time) => (result) => new Promise(resolve => setTimeout(() => resolve(result), time));

                spyOn(client, 'handleError').and.callThrough();
                spyOn(client, 'syncWithRemoteCallback').and.returnValue(Promise.all([Promise.resolve(serverResponse), Promise.resolve(delay(2000))]).then(res => res[0]));

                expect(client.doc.localCopy).toEqual(client.doc.localShadow.shadowCopy);
                expect(client.isSyncing).toBe(false);

                // leave await to pretend not to wait for next sync cycle
                client.sync();

                expect(client.isSyncing).toBe(true);

                client.create(newItem);
                const expectedAddedItem2InLocalCopy = client.doc.localCopy
                    .filter(item => item.id === '2e8dey30-3d2c-11ea-91ec-af2b74427547')
                    .reduce((previousValue, currentValue) => currentValue, undefined);
                expect(client.doc.localCopy).not.toEqual(client.doc.localShadow.shadowCopy);
                expect(expectedAddedItem2InLocalCopy).toEqual(newItem);

                const syncedDoc = await client.sync();
                expect(client.handleError).toHaveBeenCalledTimes(2);

                const expectedAddedItem2InShadow = client.doc.localShadow.shadowCopy
                    .filter(item => item.id === '2e8dey30-3d2c-11ea-91ec-af2b74427547')
                    .reduce((previousValue, currentValue) => currentValue, undefined);
                expect(syncedDoc).not.toEqual(client.doc.localShadow.shadowCopy);
                expect(expectedAddedItem2InShadow).not.toEqual(newItem);
            });

            it('should run the sync function twice with a delay. The second run must be aborted and the storeLocalData must have been called.', async () => {
                const serverResponse: EditsDTO = {
                    "clientReplicaId": "d41529d0-3e1a-11ea-aa47-590e5674016b",
                    "edits": [],
                    "localVersion": 38,
                    "remoteVersion": 12
                };

                spyOn(client, 'handleError').and.callThrough();
                spyOn(client, 'syncWithRemoteCallback').and.returnValue(Promise.all([Promise.resolve(serverResponse), Promise.resolve(delay(2000))]).then(res => res[0]));
                spyOn(client.dataAdapter, 'updateLocalData').and.callThrough()

                expect(client.doc.localCopy).toEqual(client.doc.localShadow.shadowCopy);
                expect(client.isSyncing).toBe(false);

                // leave await to pretend not to wait for next sync cycle
                client.sync();
                expect(client.isSyncing).toBe(true);

                await client.sync();
                expect(client.handleError).toHaveBeenCalledTimes(2);
                expect(client.dataAdapter.updateLocalData).toHaveBeenCalledTimes(2);
            });
        });

        describe('Case 4. Lost outbound packet: client sends changes to the server, but server NEVER receives it', async () => {
            it('should run sync function once, catch an http error and return document. Local copy and shadow must be the same, diff must then still contain changes', async () => {
                const newItem1 = {
                    "id": "2e8dex20-3d2c-11ea-91ec-af2b74427547",
                    "title": "Item 5",
                    "complete": false,
                    "createdAt": "2020-01-22T15:30:55.713Z",
                    "updatedAt": "2020-01-23T17:47:59.852Z"
                };
                const fakeSyncRemoteWithErrorCallback = async (editMessage: EditsDTO): Promise<any> => {
                    return await throwError({message: 'HTTP_ERROR_RESPONSE:'}).toPromise();
                };
                spyOn(client, 'handleError').and.callThrough();
                spyOn(client, 'syncWithRemoteCallback').and.callFake(fakeSyncRemoteWithErrorCallback);
                spyOn(client.dataAdapter, 'storeLocalData').and.callThrough();

                expect(client.doc.localCopy).toEqual(client.doc.localShadow.shadowCopy);
                client.create(newItem1);
                expect(client.doc.localCopy).not.toEqual(client.doc.localShadow.shadowCopy);

                await client.sync();

                expect(client.handleError).toHaveBeenCalledTimes(1);
                expect(client.doc.localShadow.shadowCopy).toEqual(client.doc.localCopy);
                expect(client.syncWithRemoteCallback).toHaveBeenCalledTimes(1)
                expect(client.handleError).toHaveBeenCalledTimes(1)
            });

            it('should run sync function once, catch an http error and return document. Local copy and shadow must be the same and storeLocalData must have been called', async () => {
                const fakeSyncRemoteWithErrorCallback = async (editMessage: EditsDTO): Promise<any> => {
                    return await throwError({message: 'HTTP_ERROR_RESPONSE:'}).toPromise();
                };
                spyOn(client, 'handleError').and.callThrough();
                spyOn(client, 'syncWithRemoteCallback').and.callFake(fakeSyncRemoteWithErrorCallback);
                spyOn(client.dataAdapter, 'updateLocalData').and.callThrough();

                expect(client.doc.localCopy).toEqual(client.doc.localShadow.shadowCopy);

                 await client.sync();

                expect(client.handleError).toHaveBeenCalledTimes(1);
                expect(client.dataAdapter.updateLocalData).toHaveBeenCalledTimes(1);
                expect(client.syncWithRemoteCallback).toHaveBeenCalledTimes(1);
                expect(client.handleError).toHaveBeenCalledTimes(1);
            });
        });

        describe('Case 5. Lost return packet: client sends changes to the server, server receives it but Response will get lost. ', async () => {
            it('should increase the version number of the local version and apply the patch into the shadow.' +
                'Due to the not matching server version numbers the server edits will not be applied to the local copy and the shadow and server version number not be incremented', async () => {

                const newItem = {
                    "id": "2e8dex20-3d2c-11ea-91ec-af2b74427547",
                    "title": "Item 5",
                    "complete": false,
                    "createdAt": "2020-01-22T15:30:55.713Z",
                    "updatedAt": "2020-01-23T17:47:59.852Z"
                };
                const serverResponse: EditsDTO = {
                    "clientReplicaId": "d41529d0-3e1a-11ea-aa47-590e5674016b",
                    "edits": [{
                        "remoteVersion": 11,
                        "localVersion": 38,
                        "diff": {
                            "b0e4e550-40e9-11ea-9223-f52bb709b5ad": [{
                                "title": "item 6",
                                "id": "b0e4e550-40e9-11ea-9223-f52bb709b5ad",
                                "complete": false,
                                "updatedAt": "2020-01-27T09:45:02.757Z",
                                "createdAt": "2020-01-27T09:45:02.757Z"
                            }]
                        }
                    }],
                    "localVersion": 38,
                    "remoteVersion": 11
                };
                spyOn(client, 'syncWithRemoteCallback').and.returnValue(of(serverResponse).toPromise());
                spyOn(client, 'applyDiffs').and.callThrough();
                spyOn(client, 'handleError').and.callThrough();

                client.create(newItem);

                const syncedDoc = await client.sync();
                const notInDocExistingItemFromServer = client.doc.localCopy
                    .filter(item => item.id === 'b0e4e550-40e9-11ea-9223-f52bb709b5ad')
                    .reduce((previousValue, currentValue) => currentValue, undefined);

                expect(notInDocExistingItemFromServer).toEqual(undefined);

                expect(client.doc.localShadow.localVersion).toBe(38);
                expect(client.doc.localShadow.remoteVersion).toBe(12);
                expect(client.doc.localShadow.shadowCopy).toEqual(syncedDoc);
                expect(client.doc.edits.length).toBe(0);
                expect(client.handleError).not.toHaveBeenCalled();
                expect(client.applyDiffs).toHaveBeenCalledTimes(1);
            });

            it('should increase the version number of the local version and apply the patch into the shadow. ' +
                'Due to the not matching version numbers the patch will be rejected and the edits not be emptied', async () => {

                const newItem = {
                    "id": "2e8dex20-3d2c-11ea-91ec-af2b74427547",
                    "title": "Item 5",
                    "complete": false,
                    "createdAt": "2020-01-22T15:30:55.713Z",
                    "updatedAt": "2020-01-23T17:47:59.852Z"
                };
                const serverResponse: EditsDTO = {
                    "clientReplicaId": "d41529d0-3e1a-11ea-aa47-590e5674016b",
                    "edits": [],
                    "localVersion": 37,
                    "remoteVersion": 12
                };
                spyOn(client, 'syncWithRemoteCallback').and.returnValue(of(serverResponse).toPromise());
                spyOn(client, 'applyDiffs').and.callThrough();
                spyOn(client, 'handleError').and.callThrough();

                client.create(newItem);

                const syncedDoc = await client.sync();

                expect(client.doc.localShadow.localVersion).toBe(38);
                expect(client.doc.localShadow.remoteVersion).toBe(12);
                expect(client.doc.localShadow.shadowCopy).toEqual(syncedDoc);
                expect(client.doc.edits.length).toBe(1);
                expect(client.applyDiffs).not.toHaveBeenCalled();
                expect(client.handleError).toHaveBeenCalledTimes(1);
            });
        });
    });
});
