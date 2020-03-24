import {Config} from "jsondiffpatch";
import {
    EditsDTO,
    Shadow,
    ServerDoc,
    PersistenceAdapter
} from "../core/diff-patch-sync-interfaces";
import {DiffPatchSyncServer} from "../server/diff-patch-sync-server";
import * as _ from 'lodash'

describe('DiffPatchSyncServer', async () => {

    let server: DiffPatchSyncServer<any>;
    const initialDoc: ServerDoc<any> = {
        serverCopy: [{
            "id": "a45df4c0-40e9-11ea-814a-874fa61c64c9",
            "title": "item 1",
            "complete": false,
            "createdAt": "2020-01-27T09:44:41.740Z",
            "updatedAt": "2020-01-27T09:44:41.740Z"
        }, {
            "id": "a59d0470-40e9-11ea-814a-874fa61c64c9",
            "title": "item 2",
            "complete": false,
            "createdAt": "2020-01-27T09:44:43.831Z",
            "updatedAt": "2020-01-27T09:44:43.831Z"
        }, {
            "id": "a6de3700-40e9-11ea-814a-874fa61c64c9",
            "title": "item 3",
            "complete": false,
            "createdAt": "2020-01-27T09:44:45.936Z",
            "updatedAt": "2020-01-27T09:44:45.936Z"
        }, {
            "id": "a8674800-40e9-11ea-814a-874fa61c64c9",
            "title": "item 4",
            "complete": false,
            "createdAt": "2020-01-27T09:44:48.512Z",
            "updatedAt": "2020-01-27T09:44:48.512Z"
        }],
        shadowSet: [{
            "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
            "localVersion": 0,
            "remoteVersion": 1,
            "shadowCopy": [{
                "id": "a45df4c0-40e9-11ea-814a-874fa61c64c9",
                "title": "item 1",
                "complete": false,
                "createdAt": "2020-01-27T09:44:41.740Z",
                "updatedAt": "2020-01-27T09:44:41.740Z"
            }, {
                "id": "a59d0470-40e9-11ea-814a-874fa61c64c9",
                "title": "item 2",
                "complete": false,
                "createdAt": "2020-01-27T09:44:43.831Z",
                "updatedAt": "2020-01-27T09:44:43.831Z"
            }, {
                "id": "a6de3700-40e9-11ea-814a-874fa61c64c9",
                "title": "item 3",
                "complete": false,
                "createdAt": "2020-01-27T09:44:45.936Z",
                "updatedAt": "2020-01-27T09:44:45.936Z"
            }, {
                "id": "a8674800-40e9-11ea-814a-874fa61c64c9",
                "title": "item 4",
                "complete": false,
                "createdAt": "2020-01-27T09:44:48.512Z",
                "updatedAt": "2020-01-27T09:44:48.512Z"
            }]
        }, {
            "clientReplicaId": "d5e6b610-40fa-11ea-95d3-f70da17003fb",
            "localVersion": 0,
            "remoteVersion": 1,
            "shadowCopy": [{
                "id": "a45df4c0-40e9-11ea-814a-874fa61c64c9",
                "title": "item 1",
                "complete": false,
                "createdAt": "2020-01-27T09:44:41.740Z",
                "updatedAt": "2020-01-27T09:44:41.740Z"
            }, {
                "id": "a59d0470-40e9-11ea-814a-874fa61c64c9",
                "title": "item 2",
                "complete": false,
                "createdAt": "2020-01-27T09:44:43.831Z",
                "updatedAt": "2020-01-27T09:44:43.831Z"
            }, {
                "id": "a6de3700-40e9-11ea-814a-874fa61c64c9",
                "title": "item 3",
                "complete": false,
                "createdAt": "2020-01-27T09:44:45.936Z",
                "updatedAt": "2020-01-27T09:44:45.936Z"
            }, {
                "id": "a8674800-40e9-11ea-814a-874fa61c64c9",
                "title": "item 4",
                "complete": false,
                "createdAt": "2020-01-27T09:44:48.512Z",
                "updatedAt": "2020-01-27T09:44:48.512Z"
            }]
        }]
    };
    let mutableDoc: ServerDoc<any>;

    const dataAdapterMock: PersistenceAdapter<any> = {
        async saveItem(item: any): Promise<any> {
            return await Promise.resolve(mutableDoc.serverCopy.push({...item}));
        }, async saveShadow(shadow: Shadow<any>): Promise<any> {
            return Promise.resolve(mutableDoc.shadowSet.push({...shadow}));
        }, async deleteItem(item: any): Promise<any> {
            return await Promise.all(mutableDoc.serverCopy = mutableDoc.serverCopy.filter(it => it.id !== item.id));
        }, async deleteShadow(shadow: Shadow<any>): Promise<any> {
            return await Promise.all(mutableDoc.shadowSet = mutableDoc.shadowSet.filter(it => it.clientReplicaId !== shadow.clientReplicaId));
        }, async findAllItems(): Promise<any[]> {
            return await Promise.resolve(_.cloneDeep(mutableDoc.serverCopy));
        }, async findAllShadows(): Promise<Shadow<any>[]> {
            return await Promise.resolve(_.cloneDeep(mutableDoc.shadowSet));
        }, async findShadowById(id: string): Promise<Shadow<any>> {
            return await Promise.resolve(mutableDoc.shadowSet.filter(it => it.clientReplicaId === id).reduce((previousValue, currentValue) => currentValue, undefined));
        }, async updateItem(item: any): Promise<any> {
            return await Promise.all(mutableDoc.serverCopy = mutableDoc.serverCopy.map(it => it.id === item.id ? item : it));
        }, async updateShadow(shadow: Shadow<any>): Promise<any> {
            return await Promise.all(mutableDoc.shadowSet = mutableDoc.shadowSet.map(it => it.clientReplicaId === shadow.clientReplicaId ? shadow : it));
        }
    };

    const diffPatchOptions: Config = {
        objectHash: (item: any, index: number) => {
            // try to find the id property
            return item.id;
        }
    };

    beforeEach(async () => {
        mutableDoc = _.cloneDeep(initialDoc);
        server = new DiffPatchSyncServer<any>(dataAdapterMock);
        expect(server).toBeTruthy();
    });

    describe('constructor()', async () => {
        it('should be initiated with diffPatchOptions after being created', async () => {
            server = new DiffPatchSyncServer<any>(dataAdapterMock, diffPatchOptions);
            expect(server).toBeTruthy();
            expect(server.diffPatchSyncHelper).toBeTruthy();
            expect(server.diffPatchSyncHelper.diffPatchOptions).toEqual(diffPatchOptions);
        });

        it('should be initiated with no diffPatchOptions', async () => {
            server = new DiffPatchSyncServer<any>(dataAdapterMock);
            expect(server).toBeTruthy();
            expect(server.diffPatchSyncHelper).toBeTruthy();
            expect(server.diffPatchSyncHelper.diffPatchOptions).not.toEqual(diffPatchOptions);
        });
    });

    describe('addClientShadow()', async () => {

        it('push a deep clone of a new shadow to the shadows', async () => {

            const newShadow: Shadow<any> = {
                "clientReplicaId": "753e3d00-4100-11ea-bef7-45face065649",
                "localVersion": 0,
                "remoteVersion": 1,
                "shadowCopy": [{
                    "id": "a45df4c0-40e9-11ea-814a-874fa61c64c9",
                    "title": "item 1",
                    "complete": false,
                    "createdAt": "2020-01-27T09:44:41.740Z",
                    "updatedAt": "2020-01-27T09:44:41.740Z"
                }, {
                    "id": "a59d0470-40e9-11ea-814a-874fa61c64c9",
                    "title": "item 2",
                    "complete": false,
                    "createdAt": "2020-01-27T09:44:43.831Z",
                    "updatedAt": "2020-01-27T09:44:43.831Z"
                }, {
                    "id": "a6de3700-40e9-11ea-814a-874fa61c64c9",
                    "title": "item 3",
                    "complete": false,
                    "createdAt": "2020-01-27T09:44:45.936Z",
                    "updatedAt": "2020-01-27T09:44:45.936Z"
                }, {
                    "id": "a8674800-40e9-11ea-814a-874fa61c64c9",
                    "title": "item 4",
                    "complete": false,
                    "createdAt": "2020-01-27T09:44:48.512Z",
                    "updatedAt": "2020-01-27T09:44:48.512Z"
                }]
            };

            await server.addClientShadow(newShadow);

            const shadows: Shadow<any>[] = await server.getClientShadows();
            const insertedShadow: Shadow<any> = shadows.filter(shadow => shadow.clientReplicaId === '753e3d00-4100-11ea-bef7-45face065649')
                .reduce((previousValue, currentValue) => currentValue, undefined);

            expect(insertedShadow).toEqual(newShadow);
            expect(insertedShadow).not.toBe(newShadow);
        });
    });

    describe('getClientShadowById()', async () => {

        it('should return a shallow clone of shadow filtered by replicaId', async () => {
            const expectedShadow: Shadow<any> = {
                "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                "localVersion": 0,
                "remoteVersion": 1,
                "shadowCopy": [{
                    "id": "a45df4c0-40e9-11ea-814a-874fa61c64c9",
                    "title": "item 1",
                    "complete": false,
                    "createdAt": "2020-01-27T09:44:41.740Z",
                    "updatedAt": "2020-01-27T09:44:41.740Z"
                }, {
                    "id": "a59d0470-40e9-11ea-814a-874fa61c64c9",
                    "title": "item 2",
                    "complete": false,
                    "createdAt": "2020-01-27T09:44:43.831Z",
                    "updatedAt": "2020-01-27T09:44:43.831Z"
                }, {
                    "id": "a6de3700-40e9-11ea-814a-874fa61c64c9",
                    "title": "item 3",
                    "complete": false,
                    "createdAt": "2020-01-27T09:44:45.936Z",
                    "updatedAt": "2020-01-27T09:44:45.936Z"
                }, {
                    "id": "a8674800-40e9-11ea-814a-874fa61c64c9",
                    "title": "item 4",
                    "complete": false,
                    "createdAt": "2020-01-27T09:44:48.512Z",
                    "updatedAt": "2020-01-27T09:44:48.512Z"
                }]
            };
            const shadow: Shadow<any> = await server.getClientShadowById(expectedShadow.clientReplicaId);

            expect(shadow).toEqual(expectedShadow);
            expect(shadow).not.toBe(expectedShadow);
        });
    });

    describe('updateClientShadow()', async () => {

        it('should exchange the to be updated item by a deep cloned updated item in the shadow', async () => {
            const toBeUpdatedShadow: Shadow<any> = {
                "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                "localVersion": 0,
                "remoteVersion": 1,
                "shadowCopy": [{
                    "id": "a45df4c0-40e9-11ea-814a-874fa61c64c9",
                    "title": "item 1",
                    "complete": false,
                    "createdAt": "2020-01-27T09:44:41.740Z",
                    "updatedAt": "2020-01-27T09:44:41.740Z"
                }, {
                    "id": "a59d0470-40e9-11ea-814a-874fa61c64c9",
                    "title": "item 2",
                    "complete": false,
                    "createdAt": "2020-01-27T09:44:43.831Z",
                    "updatedAt": "2020-01-27T09:44:43.831Z"
                }, {
                    "id": "a6de3700-40e9-11ea-814a-874fa61c64c9",
                    "title": "item 3",
                    "complete": false,
                    "createdAt": "2020-01-27T09:44:45.936Z",
                    "updatedAt": "2020-01-27T09:44:45.936Z"
                }, {
                    "id": "a8674800-40e9-11ea-814a-874fa61c64c9",
                    "title": "item 4",
                    "complete": false,
                    "createdAt": "2020-01-27T09:44:48.512Z",
                    "updatedAt": "2020-01-27T09:44:48.512Z"
                }, {
                    "id": "2e8dex20-3d2c-11ea-91ec-af2b74427547",
                    "title": "Item 5",
                    "complete": false,
                    "createdAt": "2020-01-22T15:30:55.713Z",
                    "updatedAt": "2020-01-23T17:47:59.852Z"
                }]
            };

            await server.updateClientShadow(toBeUpdatedShadow);

            const shadows: Shadow<any>[] = await server.getClientShadows()
            const updatedShadow: Shadow<any> = shadows
                .filter(shadow => shadow.clientReplicaId === 'cfad1550-40fa-11ea-89cb-0b37e84bd51b')
                .reduce((previousValue, currentValue) => currentValue, undefined);

            expect(updatedShadow).toEqual(toBeUpdatedShadow);
            expect(updatedShadow).not.toBe(toBeUpdatedShadow);
        });
    });

    describe('getServerCopy()', async () => {
        it('should return a shallow clone of the local copy', async () => {

            const localCopy = await server.getServerCopy();

            expect(localCopy).not.toBe(mutableDoc.serverCopy);
            expect(localCopy).toEqual(mutableDoc.serverCopy);
        });
    });

    describe('updateServerCopy()', async () => {
        it('should substitute the local copy with a deep clone of the parameter', async () => {
            const newItem = {
                "id": "2e8dex20-3d2c-11ea-91ec-af2b74427547",
                "title": "Item 5",
                "complete": false,
                "createdAt": "2020-01-22T15:30:55.713Z",
                "updatedAt": "2020-01-23T17:47:59.852Z"
            };
            const serverCopy: any[] = await server.getServerCopy();
            const newLocalCopy: any[] = _.cloneDeep(serverCopy);
            newLocalCopy.push(newItem);

            await server.updateServerCopy(newLocalCopy, serverCopy);

            const serverCopyAfterUpdate = await server.getServerCopy();
            const containsNewItem = serverCopyAfterUpdate
                .filter(item => item.id === '2e8dex20-3d2c-11ea-91ec-af2b74427547')
                .reduce((previousValue, currentValue) => currentValue, undefined);

            expect(containsNewItem).toEqual(newItem);
        });
    });

    describe('sync()', async () => {
        describe('Case 6. client does not have an associated serverShadow on initial load', async () => {
            it('should create a new serverShadow, increase remoteVersion and return a new Editmessage with the diffs of the new shadow and the localCopy of the server. remoteVersion on editmessage must be as it was before syncing.', (done) => {

                const incomingMessageFromClientBeforeSync: EditsDTO = {
                    "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b-new-replica-id",
                    "edits": [],
                    "localVersion": 0,
                    "remoteVersion": 0
                };
                const expectedEditsDTOAfterSync: EditsDTO = {
                    "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b-new-replica-id",
                    "edits": [{
                        "remoteVersion": 0,
                        "localVersion": 0,
                        "diff": {
                            "a45df4c0-40e9-11ea-814a-874fa61c64c9": [{
                                "id": "a45df4c0-40e9-11ea-814a-874fa61c64c9",
                                "title": "item 1",
                                "complete": false,
                                "createdAt": "2020-01-27T09:44:41.740Z",
                                "updatedAt": "2020-01-27T09:44:41.740Z"
                            }],
                            "a59d0470-40e9-11ea-814a-874fa61c64c9": [{
                                "id": "a59d0470-40e9-11ea-814a-874fa61c64c9",
                                "title": "item 2",
                                "complete": false,
                                "createdAt": "2020-01-27T09:44:43.831Z",
                                "updatedAt": "2020-01-27T09:44:43.831Z"
                            }],
                            "a6de3700-40e9-11ea-814a-874fa61c64c9": [{
                                "id": "a6de3700-40e9-11ea-814a-874fa61c64c9",
                                "title": "item 3",
                                "complete": false,
                                "createdAt": "2020-01-27T09:44:45.936Z",
                                "updatedAt": "2020-01-27T09:44:45.936Z"
                            }],
                            "a8674800-40e9-11ea-814a-874fa61c64c9": [{
                                "id": "a8674800-40e9-11ea-814a-874fa61c64c9",
                                "title": "item 4",
                                "complete": false,
                                "createdAt": "2020-01-27T09:44:48.512Z",
                                "updatedAt": "2020-01-27T09:44:48.512Z"
                            }]
                        }
                    }],
                    "localVersion": 0,
                    "remoteVersion": 0
                };

                spyOn(server.dataAdapter, 'saveShadow').and.callThrough();
                spyOn(server, 'createNewClientShadow').and.callThrough();

                server.sync(incomingMessageFromClientBeforeSync).then(async (afterSyncResponse: EditsDTO) => {
                    const shadows: Shadow<any>[] = await server.getClientShadows();

                    const serverShadowAfterSync: Shadow<any> = shadows
                        .filter(shadow => shadow.clientReplicaId === 'cfad1550-40fa-11ea-89cb-0b37e84bd51b-new-replica-id')
                        .reduce((previousValue, currentValue) => currentValue, undefined);


                    expect(afterSyncResponse).toEqual(expectedEditsDTOAfterSync);
                    expect(serverShadowAfterSync.localVersion).toBe(0);
                    expect(serverShadowAfterSync.remoteVersion).toBe(1);
                    expect(server.createNewClientShadow).toHaveBeenCalledTimes(1);
                    expect(server.dataAdapter.saveShadow).toHaveBeenCalledTimes(1);
                    done();
                });
            });
        });

        describe('Case 7. client already has an associated serverShadow and the editMessage from client contains some diffs', async () => {
            it('should apply the diffs (CREATE) to the serverShadow and the server localCopy and increment localVersion. Serverdiffs are undefined though.', (done) => {

                const incomingMessageFromClientWithDiffsBeforeSync: EditsDTO =
                    {
                        "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                        "edits": [{
                            "localVersion": 0,
                            "remoteVersion": 1,
                            "diff": {
                                "06d4a4b0-4111-11ea-b43d-0df3389c66de": [{
                                    "title": "item 5",
                                    "id": "06d4a4b0-4111-11ea-b43d-0df3389c66de",
                                    "complete": false,
                                    "updatedAt": "2020-01-27T14:26:37.307Z",
                                    "createdAt": "2020-01-27T14:26:37.307Z"
                                }]
                            }
                        }],
                        "localVersion": 0,
                        "remoteVersion": 1
                    };
                const expectedEditsDTOAfterSync: EditsDTO = {
                    "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                    "edits": [],
                    "localVersion": 1,
                    "remoteVersion": 1
                };

                const expectedServerCopyAfterSync = [{
                    id: 'a45df4c0-40e9-11ea-814a-874fa61c64c9',
                    title: 'item 1',
                    complete: false,
                    createdAt: '2020-01-27T09:44:41.740Z',
                    updatedAt: '2020-01-27T09:44:41.740Z'
                },
                    {
                        id: 'a59d0470-40e9-11ea-814a-874fa61c64c9',
                        title: 'item 2',
                        complete: false,
                        createdAt: '2020-01-27T09:44:43.831Z',
                        updatedAt: '2020-01-27T09:44:43.831Z'
                    },
                    {
                        id: 'a6de3700-40e9-11ea-814a-874fa61c64c9',
                        title: 'item 3',
                        complete: false,
                        createdAt: '2020-01-27T09:44:45.936Z',
                        updatedAt: '2020-01-27T09:44:45.936Z'
                    },
                    {
                        id: 'a8674800-40e9-11ea-814a-874fa61c64c9',
                        title: 'item 4',
                        complete: false,
                        createdAt: '2020-01-27T09:44:48.512Z',
                        updatedAt: '2020-01-27T09:44:48.512Z'
                    },
                    {
                        title: 'item 5',
                        id: '06d4a4b0-4111-11ea-b43d-0df3389c66de',
                        complete: false,
                        updatedAt: '2020-01-27T14:26:37.307Z',
                        createdAt: '2020-01-27T14:26:37.307Z'
                    }
                ];

                spyOn(server.dataAdapter, 'saveItem').and.callThrough();
                spyOn(server, 'executeServerCopyOperations').and.callThrough();
                server.sync(incomingMessageFromClientWithDiffsBeforeSync).then(async (afterSyncResponse: EditsDTO) => {
                    const serverShadowAfterSync: Shadow<any> = await server.getClientShadowById('cfad1550-40fa-11ea-89cb-0b37e84bd51b');

                    expect(server.dataAdapter.saveItem).toHaveBeenCalledTimes(1);
                    expect(server.executeServerCopyOperations).toHaveBeenCalledTimes(1);
                    expect(afterSyncResponse).toEqual(expectedEditsDTOAfterSync);
                    expect(serverShadowAfterSync.localVersion).toBe(1);
                    expect(serverShadowAfterSync.remoteVersion).toBe(1);
                    expect(await server.getServerCopy()).toEqual(expectedServerCopyAfterSync);
                    done();
                });
            });

            it('should apply the diffs (UPDATE) to the serverShadow and the server localCopy and increment localVersion. Serverdiffs are undefined though.', async () => {

                const incomingMessageFromClientWithDiffsBeforeSync: EditsDTO =
                    {
                        "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                        "edits": [{
                            "remoteVersion": 1,
                            "localVersion": 0,
                            "diff": {
                                "a59d0470-40e9-11ea-814a-874fa61c64c9": {
                                    "complete": [false, true],
                                }
                            }
                        }],
                        "localVersion": 0,
                        "remoteVersion": 1
                    };

                const expectedEditsDTOAfterSync: EditsDTO = {
                    "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                    "edits": [],
                    "localVersion": 1,
                    "remoteVersion": 1
                };

                const expectedServerCopyAfterSync = [{
                    id: 'a45df4c0-40e9-11ea-814a-874fa61c64c9',
                    title: 'item 1',
                    complete: false,
                    createdAt: '2020-01-27T09:44:41.740Z',
                    updatedAt: '2020-01-27T09:44:41.740Z'
                },
                    {
                        id: 'a59d0470-40e9-11ea-814a-874fa61c64c9',
                        title: 'item 2',
                        complete: true,
                        createdAt: '2020-01-27T09:44:43.831Z',
                        updatedAt: '2020-01-27T09:44:43.831Z'
                    },
                    {
                        id: 'a6de3700-40e9-11ea-814a-874fa61c64c9',
                        title: 'item 3',
                        complete: false,
                        createdAt: '2020-01-27T09:44:45.936Z',
                        updatedAt: '2020-01-27T09:44:45.936Z'
                    },
                    {
                        id: 'a8674800-40e9-11ea-814a-874fa61c64c9',
                        title: 'item 4',
                        complete: false,
                        createdAt: '2020-01-27T09:44:48.512Z',
                        updatedAt: '2020-01-27T09:44:48.512Z'
                    }];

                spyOn(server, 'executeServerCopyOperations').and.callThrough();
                spyOn(server.dataAdapter, 'updateItem').and.callThrough();
                const afterSyncResponse: EditsDTO = await server.sync(incomingMessageFromClientWithDiffsBeforeSync);



                const serverShadowAfterSync: Shadow<any> = await server.getClientShadowById('cfad1550-40fa-11ea-89cb-0b37e84bd51b');

                expect(server.dataAdapter.updateItem).toHaveBeenCalledTimes(1);
                expect(server.executeServerCopyOperations).toHaveBeenCalledTimes(1);
                expect(afterSyncResponse).toEqual(expectedEditsDTOAfterSync);
                expect(serverShadowAfterSync.localVersion).toBe(1);
                expect(serverShadowAfterSync.remoteVersion).toBe(1);
                expect(await server.getServerCopy()).toEqual(expectedServerCopyAfterSync);
            });

            it('should apply the diffs (DELETE) to the serverShadow and the server localCopy and increment localVersion. Serverdiffs are undefined though.', (done) => {

                const incomingMessageFromClientWithDiffsBeforeSync: EditsDTO =
                    {
                        "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                        "edits": [{
                            "remoteVersion": 1,
                            "localVersion": 0,
                            "diff": {
                                "a59d0470-40e9-11ea-814a-874fa61c64c9": [{
                                    id: 'a59d0470-40e9-11ea-814a-874fa61c64c9',
                                    title: 'item 2',
                                    complete: false,
                                    createdAt: '2020-01-27T09:44:43.831Z',
                                    updatedAt: '2020-01-27T09:44:43.831Z'
                                }, 0, 0]
                            }
                        }],
                        "localVersion": 0,
                        "remoteVersion": 1
                    };

                const expectedEditsDTOAfterSync: EditsDTO = {
                    "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                    "edits": [],
                    "localVersion": 1,
                    "remoteVersion": 1
                };

                const expectedServerCopyAfterSync = [
                    {
                        id: 'a45df4c0-40e9-11ea-814a-874fa61c64c9',
                        title: 'item 1',
                        complete: false,
                        createdAt: '2020-01-27T09:44:41.740Z',
                        updatedAt: '2020-01-27T09:44:41.740Z'
                    },
                    {
                        id: 'a6de3700-40e9-11ea-814a-874fa61c64c9',
                        title: 'item 3',
                        complete: false,
                        createdAt: '2020-01-27T09:44:45.936Z',
                        updatedAt: '2020-01-27T09:44:45.936Z'
                    },
                    {
                        id: 'a8674800-40e9-11ea-814a-874fa61c64c9',
                        title: 'item 4',
                        complete: false,
                        createdAt: '2020-01-27T09:44:48.512Z',
                        updatedAt: '2020-01-27T09:44:48.512Z'
                    }];

                spyOn(server, 'executeServerCopyOperations').and.callThrough();
                spyOn(server.dataAdapter, 'deleteItem').and.callThrough();
                server.sync(incomingMessageFromClientWithDiffsBeforeSync).then(async (afterSyncResponse: EditsDTO) => {

                    const shadowsAfterSync: Shadow<any>[] = await server.getClientShadows();
                    const serverShadowAfterSync: Shadow<any> = shadowsAfterSync
                        .filter(shadow => shadow.clientReplicaId === 'cfad1550-40fa-11ea-89cb-0b37e84bd51b')
                        .reduce((previousValue, currentValue) => currentValue, undefined);
                    const serverCopyAfterSync = await server.getServerCopy();

                    expect(server.dataAdapter.deleteItem).toHaveBeenCalledTimes(1);
                    expect(server.executeServerCopyOperations).toHaveBeenCalledTimes(1);
                    expect(afterSyncResponse).toEqual(expectedEditsDTOAfterSync);
                    expect(serverShadowAfterSync.localVersion).toBe(1);
                    expect(serverShadowAfterSync.remoteVersion).toBe(1);
                    expect(serverCopyAfterSync).toEqual(expectedServerCopyAfterSync);
                    done();
                });
            });
        });

        describe('Case 8: client already has an associated serverShadow and due to some intermediate changes from another client there are some server diffs', async () => {
            it('should detect a diff between the clients shadow and the server localCopy and increment the remoteVersion. Serverdiffs are reflected in the edit message response as edits.', async (done) => {

                const incomingMessageFromClientBeforeSync: EditsDTO =
                    {
                        "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                        "edits": [],
                        "localVersion": 0,
                        "remoteVersion": 1
                    };
                const expectedEditsDTOWithDiffsAfterSync: EditsDTO = {
                    "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                    "edits": [{
                        "remoteVersion": 1,
                        "localVersion": 0,
                        "diff": {
                            "d9b3d6c0-4112-11ea-bf0f-774050fb2c80": [{
                                "title": "item 6",
                                "id": "d9b3d6c0-4112-11ea-bf0f-774050fb2c80",
                                "complete": false,
                                "updatedAt": "2020-01-27T14:39:40.589Z",
                                "createdAt": "2020-01-27T14:39:40.589Z"
                            }]
                        }
                    }],
                    "localVersion": 0,
                    "remoteVersion": 1
                };

                const newItem = {
                    "id": "d9b3d6c0-4112-11ea-bf0f-774050fb2c80",
                    "title": "item 6",
                    "complete": false,
                    "updatedAt": "2020-01-27T14:39:40.589Z",
                    "createdAt": "2020-01-27T14:39:40.589Z"
                };
                const newLocalCopy: any[] = await server.getServerCopy();

                newLocalCopy.push(newItem);

                spyOn(server, 'getServerCopy').and.returnValue(Promise.resolve(newLocalCopy));

                server.sync(incomingMessageFromClientBeforeSync).then(async (afterSyncResponse: EditsDTO) => {
                    const serverShadowAfterSync: Shadow<any> = await server.getClientShadowById('cfad1550-40fa-11ea-89cb-0b37e84bd51b');

                    expect(afterSyncResponse).toEqual(expectedEditsDTOWithDiffsAfterSync);
                    expect(serverShadowAfterSync.localVersion).toBe(0);
                    expect(serverShadowAfterSync.remoteVersion).toBe(2);
                    done();
                });
            });
        });

        describe('Case 9: client already has an associated serverShadow and the server receives two requests, where the second request contains a change which already has been applied to the server (packet lost on return)', async () => {
            it('should detect that the version numbers of the edit and the shadow do not match and only apply the edits where the versions are matching.', async () => {

                const incomingMessageFromClientWithDiffsBeforeSync: EditsDTO =
                    {
                        "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                        "edits": [{
                            "localVersion": 0,
                            "remoteVersion": 1,
                            "diff": {
                                "06d4a4b0-4111-11ea-b43d-0df3389c66de": [{
                                    "title": "item 5",
                                    "id": "06d4a4b0-4111-11ea-b43d-0df3389c66de",
                                    "complete": false,
                                    "updatedAt": "2020-01-27T14:26:37.307Z",
                                    "createdAt": "2020-01-27T14:26:37.307Z"
                                }]
                            }
                        }],
                        "localVersion": 0,
                        "remoteVersion": 1
                    };

                const incomingMessageFromClientContainingOldDiff: EditsDTO =
                    {
                        "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                        "edits": [
                            {
                                "localVersion": 0,
                                "remoteVersion": 1,
                                "diff": {
                                    "06d4a4b0-4111-11ea-b43d-0df3389c66de": [{
                                        "title": "item 5",
                                        "id": "06d4a4b0-4111-11ea-b43d-0df3389c66de",
                                        "complete": false,
                                        "updatedAt": "2020-01-27T14:26:37.307Z",
                                        "createdAt": "2020-01-27T14:26:37.307Z"
                                    }]
                                }
                            },
                            {
                                "localVersion": 1,
                                "remoteVersion": 1,
                                "diff": {
                                    "d9b3d6c0-4112-11ea-bf0f-774050fb2c80": [{
                                        "id": "d9b3d6c0-4112-11ea-bf0f-774050fb2c80",
                                        "title": "item 6",
                                        "complete": false,
                                        "updatedAt": "2020-01-27T14:39:40.589Z",
                                        "createdAt": "2020-01-27T14:39:40.589Z"
                                    }]
                                }
                            }
                        ],
                        "localVersion": 1,
                        "remoteVersion": 1
                    };

                const expectedEditsDTOAfterFirstSync: EditsDTO = {
                    "clientReplicaId": "cfad1550-40fa-11ea-89cb-0b37e84bd51b",
                    "edits": [],
                    "localVersion": 1,
                    "remoteVersion": 1
                };

                const expectedOutcome = {
                    clientReplicaId: 'cfad1550-40fa-11ea-89cb-0b37e84bd51b',
                    localVersion: 2,
                    remoteVersion: 1,
                    shadowCopy:
                        [{
                            id: 'a45df4c0-40e9-11ea-814a-874fa61c64c9',
                            title: 'item 1',
                            complete: false,
                            createdAt: '2020-01-27T09:44:41.740Z',
                            updatedAt: '2020-01-27T09:44:41.740Z'
                        },
                            {
                                id: 'a59d0470-40e9-11ea-814a-874fa61c64c9',
                                title: 'item 2',
                                complete: false,
                                createdAt: '2020-01-27T09:44:43.831Z',
                                updatedAt: '2020-01-27T09:44:43.831Z'
                            },
                            {
                                id: 'a6de3700-40e9-11ea-814a-874fa61c64c9',
                                title: 'item 3',
                                complete: false,
                                createdAt: '2020-01-27T09:44:45.936Z',
                                updatedAt: '2020-01-27T09:44:45.936Z'
                            },
                            {
                                id: 'a8674800-40e9-11ea-814a-874fa61c64c9',
                                title: 'item 4',
                                complete: false,
                                createdAt: '2020-01-27T09:44:48.512Z',
                                updatedAt: '2020-01-27T09:44:48.512Z'
                            },
                            {
                                title: 'item 5',
                                id: '06d4a4b0-4111-11ea-b43d-0df3389c66de',
                                complete: false,
                                updatedAt: '2020-01-27T14:26:37.307Z',
                                createdAt: '2020-01-27T14:26:37.307Z'
                            },
                            {
                                id: 'd9b3d6c0-4112-11ea-bf0f-774050fb2c80',
                                title: 'item 6',
                                complete: false,
                                updatedAt: '2020-01-27T14:39:40.589Z',
                                createdAt: '2020-01-27T14:39:40.589Z'
                            }]
                };

                spyOn(server, 'logEditAlreadyApplied').withArgs(1, 1, 0, 1);

                // this first sync cycle works so far and we pretend to lose the response of this
                const afterFirstSyncResponse: EditsDTO = await server.sync(incomingMessageFromClientWithDiffsBeforeSync);
                const shadows: Shadow<any>[] = await server.getClientShadows();
                const serverShadowAfterFirstSync: Shadow<any> = shadows
                    .filter(shadow => shadow.clientReplicaId === 'cfad1550-40fa-11ea-89cb-0b37e84bd51b')
                    .reduce((previousValue, currentValue) => currentValue, undefined);

                expect(afterFirstSyncResponse).toEqual(expectedEditsDTOAfterFirstSync);
                expect(serverShadowAfterFirstSync.localVersion).toBe(1);
                expect(serverShadowAfterFirstSync.remoteVersion).toBe(1);

                await server.sync(incomingMessageFromClientContainingOldDiff);

                const shadowsAfterSync: Shadow<any>[] = await server.getClientShadows()
                const serverShadowAfterSecondSync: Shadow<any> = shadowsAfterSync
                    .filter(shadow => shadow.clientReplicaId === 'cfad1550-40fa-11ea-89cb-0b37e84bd51b')
                    .reduce((previousValue, currentValue) => currentValue, undefined);

                expect(server.logEditAlreadyApplied).toHaveBeenCalledTimes(1);
                expect(serverShadowAfterSecondSync).toEqual(expectedOutcome);
                expect(serverShadowAfterSecondSync.localVersion).toBe(2);
                expect(serverShadowAfterSecondSync.remoteVersion).toBe(1);
            });
        });
    })
});
