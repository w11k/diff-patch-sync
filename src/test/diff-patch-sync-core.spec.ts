import {DiffPatchSyncHelper} from "../core/diff-patch-sync-helper";
import {Config, create, Delta} from "jsondiffpatch";
import * as _ from 'lodash'


describe('DiffPatchSyncHelper', async () => {

    let helper: DiffPatchSyncHelper<any>;
    beforeEach(async () => {
        helper = new DiffPatchSyncHelper();
        expect(helper).toBeTruthy();
    });

    describe('constructor()', async () => {
        it('should be initiated with diffPatchOptions after being created', () => {
            const diffPatchOptions: Config = {
                textDiff: {
                    minLength: 10
                }
            };
            helper = new DiffPatchSyncHelper(diffPatchOptions);

            expect(helper).toBeTruthy();
            expect(helper.diffPatchOptions).toBe(diffPatchOptions);
            expect(helper.diffMatchPatch).not.toBe(undefined);
        });

        it('should be initiated with initial diffPatchOptions after being created', () => {
            helper = new DiffPatchSyncHelper();

            expect(helper).toBeTruthy();
            expect(helper.diffPatchOptions.textDiff.minLength).toBe(5);
            expect(helper.diffMatchPatch).not.toBe(undefined);
        });
    });

    describe('patchInto()', async () => {

        describe('Case 10: DELETE', async () => {
            it('should not contain item 3 after patching', () => {
                const left = [
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
                    }
                ];

                const expectedOutcome = [
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
                    }
                ];


                const deleteDiff = {
                    "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244": [{
                        "title": "Item 3",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }, 0, 0]
                }; // delete Item 3

                const deletePatch = helper.patchInto(left, deleteDiff);                      //patched document
                expect(deletePatch).toEqual(expectedOutcome);
            });
        });

        describe('Case 11: CREATE', async () => {
            it('should contain item 3 after patching', () => {
                const left = [
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
                    }
                ];

                const expectedOutcome = [
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
                    }
                ];

                const createDiff = {
                    "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244": [{
                        "title": "Item 3",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }]
                }; // create Item 3

                const createPatch = helper.patchInto(left, createDiff);                      //patched document
                expect(createPatch).toEqual(expectedOutcome);
            });
        });

        describe('Case 12: UPDATE', async () => {
            it('should contain updated item 3 after patching', () => {
                const left = [
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
                    }
                ];

                const expectedOutcome = [
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
                        "title": "Item 3 UPDATED",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }
                ];

                const updateDiff = {"c48ab280-3df4-11ea-8e4f-ab4cbb7ac244": {"title": ["@@ -1,6 +1,14 @@\n Item 3\n+ UPDATED\n", 0, 2]}}; // update Item 3

                const updatePatch = helper.patchInto(left, updateDiff);                      //patched document
                expect(updatePatch).toEqual(expectedOutcome);
            });
        });
    });

    describe('createDiff()', async () => {

        describe('Case 13: Undefined Diff', async () => {
            it('should create no diff, because Dokuments are identical', () => {
                const left = [
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
                    }
                ];

                const right = [
                    {
                        "title": "Item 3",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    },{
                        "id": "2e8ded10-3d2c-11ea-91ec-af2b74427547",
                        "title": "Item 1",
                        "complete": false,
                        "createdAt": "2020-01-22T15:30:55.713Z",
                        "updatedAt": "2020-01-23T17:47:59.852Z"
                    },{
                        "title": "Item 2",
                        "id": "6ea9eba0-3deb-11ea-9820-ff0194468160",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:04.950Z",
                        "createdAt": "2020-01-23T14:19:57.146Z"
                    }
                ];

                const diff = helper.createDiff(left, right);

                expect(diff).toEqual(undefined);
            });
        });

        describe('Case 14: DELETE', async () => {
            it('should create a diff for deleting item 3', () => {
                const left = [
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
                    }
                ];

                const rightWithDeletedItem = [
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
                    }
                ];


                const expectedDiff = {
                    "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244": [{
                        "title": "Item 3",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }, 0, 0]
                }; // delete Item 3

                const diff = helper.createDiff(left, rightWithDeletedItem);


                expect(diff).toEqual(expectedDiff);
            });
        });

        describe('Case 15: CREATE', async () => {
            it('should create a diff for creating item 3', () => {
                const left = [
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
                    }
                ];

                const rightWithCreatedItem = [
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
                    }
                ];

                const expectedDiff = {
                    "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244": [{
                        "title": "Item 3",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }]
                }; // create Item 3

                const diff = helper.createDiff(left, rightWithCreatedItem)
                expect(diff).toEqual(expectedDiff);
            });
        });

        describe('Case 16: UPDATE', async () => {
            it('should create a diff for updating item 3', () => {
                const left = [
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
                    }
                ];

                const rightWithUpdatedItem = [
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
                        "title": "Item 3 UPDATED",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }
                ];

                const expectedDiff = {"c48ab280-3df4-11ea-8e4f-ab4cbb7ac244": {"title": ["@@ -1,6 +1,14 @@\n Item 3\n+ UPDATED\n", 0, 2]}}; // update Item 3

                const diff = helper.createDiff(left, rightWithUpdatedItem);
                expect(diff).toEqual(expectedDiff);
            });
        });
    });

    describe('patchInto() and createDiff()', async () => {
        describe('DELETE/UPDATE', async () => {

            it('Case 17: should first DELETE and then UPDATE the item -> RESOLVED', function () {
                const left = [
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
                    }
                ];
                const rightWithDeletedItem = [
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
                    }
                ];
                const expectedOutcome = [{
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
                    "title": "Item 3 UPDATED",
                    "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                    "complete": false,
                    "updatedAt": "2020-01-23T17:48:09.000Z",
                    "createdAt": "2020-01-23T15:26:46.696Z"
                }];

                const diff: Delta = helper.createDiff(left, rightWithDeletedItem);
                expect(diff).toEqual({
                    "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244": [{
                        "title": "Item 3",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }, 0, 0]
                }); // DELETE WORKS

                const leftUpdated = _.cloneDeep(left).map(item => {
                    if (item.title === 'Item 3') {
                        item.title = 'Item 3 UPDATED'
                    }
                    return item
                });
                const updatedDiff = helper.createDiff(left, leftUpdated);// Create Diff to update deleted item at next step
                expect(updatedDiff).toEqual({"c48ab280-3df4-11ea-8e4f-ab4cbb7ac244": {"title": ["@@ -1,6 +1,14 @@\n Item 3\n+ UPDATED\n", 0, 2]}});

                spyOn(helper, 'recoverDeletedItems').and.callThrough();
                const recoveredItemAndPatched = helper.patchInto(rightWithDeletedItem, updatedDiff, left);                      //try to update the deleted item by patching it, giving the old state as a parameter being able to recover it
                expect(recoveredItemAndPatched).toEqual(expectedOutcome);
                expect(helper.recoverDeletedItems).toHaveBeenCalledTimes(1);
            });

            it('Case 18: should first DELETE and then UPDATE the item -> ERROR', function () {
                const left = [
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
                    }
                ];
                const rightWithDeletedItem = [
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
                    }
                ];
                const expectedOutcome = [{
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
                    "title": "Item 3 UPDATED",
                    "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                    "complete": false,
                    "updatedAt": "2020-01-23T17:48:09.000Z",
                    "createdAt": "2020-01-23T15:26:46.696Z"
                }];

                const diff: Delta = helper.createDiff(left, rightWithDeletedItem);
                expect(diff).toEqual({
                    "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244": [{
                        "title": "Item 3",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }, 0, 0]
                }); // DELETE WORKS

                const leftUpdated = _.cloneDeep(left).map(item => {
                    if (item.title === 'Item 3') {
                        item.title = 'Item 3 UPDATED'
                    }
                    return item
                });
                const updatedDiff = helper.createDiff(left, leftUpdated);// Create Diff to update deleted item at next step
                expect(updatedDiff).toEqual({"c48ab280-3df4-11ea-8e4f-ab4cbb7ac244": {"title": ["@@ -1,6 +1,14 @@\n Item 3\n+ UPDATED\n", 0, 2]}});

                try {
                    const notPatched = helper.patchInto(rightWithDeletedItem, updatedDiff);                      //try to update the deleted item by patching it, NOT giving the old state as a parameter and not being able to recover it
                    expect(notPatched).not.toEqual(expectedOutcome);
                } catch (e) {
                    expect(e).not.toEqual(undefined);
                }
            });

            it('should first UPDATE and then DELETE the item', function () {
                const left = [
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
                    }
                ];

                const rightWithUpdatedItem = _.cloneDeep(left).map(item => {
                    if (item.title === 'Item 3') {
                        item.title = 'Item 3 UPDATED'
                    }
                    return item
                });

                const rightWithDeletedItem = _.cloneDeep(left).filter(item => item.title !== 'Item 3');

                const expectedOutcome = [
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
                    }
                ];

                const updatedDiff = helper.createDiff(left, rightWithUpdatedItem);

                expect(updatedDiff).toEqual({"c48ab280-3df4-11ea-8e4f-ab4cbb7ac244": {"title": ["@@ -1,6 +1,14 @@\n Item 3\n+ UPDATED\n", 0, 2]}}); // UPDATE WORKS

                const updatedPatched = helper.patchInto(left, updatedDiff);

                const deletedDiff = helper.createDiff(updatedPatched, rightWithDeletedItem);

                expect(deletedDiff).toEqual({
                    "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244": [{
                        "title": "Item 3 UPDATED",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }, 0, 0]
                }); // DELETE WORKS

                const deletedPatched = helper.patchInto(updatedPatched, deletedDiff);
                expect(deletedPatched).toEqual(expectedOutcome);
            });
        });

        describe('UPDATE/UPDATE', async () => {
            it('should first UPDATE and then UPDATE the item again', function () {
                const left = [
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
                    }
                ];
                const rightWithChangedPositionItem = [
                    {
                        "id": "2e8ded10-3d2c-11ea-91ec-af2b74427547",
                        "title": "Item 1",
                        "complete": false,
                        "createdAt": "2020-01-22T15:30:55.713Z",
                        "updatedAt": "2020-01-23T17:47:59.852Z"
                    }, {
                        "title": "Item 3",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }, {
                        "title": "Item 2 CHANGED POSITION",
                        "id": "6ea9eba0-3deb-11ea-9820-ff0194468160",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:04.950Z",
                        "createdAt": "2020-01-23T14:19:57.146Z"
                    }
                ];

                const expectedOutcome = [
                    {
                        "id": "2e8ded10-3d2c-11ea-91ec-af2b74427547",
                        "title": "Item 1",
                        "complete": false,
                        "createdAt": "2020-01-22T15:30:55.713Z",
                        "updatedAt": "2020-01-23T17:47:59.852Z"
                    }, {
                        "title": "Item 3 UPDATED",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }, {
                        "title": "Item 2 CHANGED POSITION",
                        "id": "6ea9eba0-3deb-11ea-9820-ff0194468160",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:04.950Z",
                        "createdAt": "2020-01-23T14:19:57.146Z"
                    }
                ];

                const changedPositionDiff: Delta = helper.createDiff(left, rightWithChangedPositionItem);
                expect(changedPositionDiff).toEqual({"6ea9eba0-3deb-11ea-9820-ff0194468160":{"title":["@@ -1,6 +1,23 @@\n Item 2\n+ CHANGED POSITION\n",0,2]}}); // CHANGING POSITIONS WORKS

                const leftUpdated = _.cloneDeep(left).map(item => {
                    if (item.title === 'Item 3') {
                        item.title = 'Item 3 UPDATED'
                    }
                    return item
                });
                const updatedDiff = helper.createDiff(left, leftUpdated);
                expect(updatedDiff).toEqual({"c48ab280-3df4-11ea-8e4f-ab4cbb7ac244":{"title":["@@ -1,6 +1,14 @@\n Item 3\n+ UPDATED\n",0,2]}});

                const patch = helper.patchInto(rightWithChangedPositionItem, updatedDiff);
                expect(patch).toEqual(expectedOutcome); // Final patch does work
            });
        });
    });

    describe('some test without converting the array to an object before diffing and patching', async () => {

        const createDiffWithoutConverting = (left, right) => {
            const delta = create({
                objectHash: function (obj, index) {
                    // try to find an id property, otherwise just use the index in the array
                    return obj.id;
                },
                textDiff: {
                    // default 60, minimum string length (left and right sides) to use text diff algorythm: google-diff-match-patch
                    minLength: 1
                },
                arrays: {
                    detectMove: false,
                }
            }).diff(left, right);

            return delta;
        };

        const patchIntoWithoutConverting = (left, patch) => {
            const delta = create({
                objectHash: function (obj, index) {
                    // try to find an id property, otherwise just use the index in the array
                    return obj.id;
                },
                textDiff: {
                    // default 60, minimum string length (left and right sides) to use text diff algorythm: google-diff-match-patch
                    minLength: 1
                },
                arrays: {
                    detectMove: false,
                }
            }).patch(left, patch);

            return delta;
        };

        describe('patchIntoWithoutConverting() and createDiffWithoutConverting() works for Objects and Arrays, when the array which has to be patched has NOT changed after the diff has been taken', async () => {
            it('should be undefined for similar object', function () {

                const left = {name: 'tito'};
                const right = {name: 'tito'};

                const diff = createDiffWithoutConverting(left, right);

                expect(diff).toBe(undefined);

            });

            it('should be defined for different objects', function () {

                const left = {name: 'tito'};
                const right = {name: 'tita'};

                const diff: Delta = createDiffWithoutConverting(left, right);

                expect(diff).toEqual({"name": ["@@ -1,4 +1,4 @@\n tit\n-o\n+a\n", 0, 2]});
            });

            it('should be undefined for similar arrays', function () {

                const left = [
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
                    }
                ];
                const right = [
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
                    }
                ];

                const diff: Delta = createDiffWithoutConverting(left, right);

                expect(diff).toEqual(undefined);
            });

            it('should be defined for different arrays (DELETE)', function () {

                const left = [
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
                    }
                ];
                const rightWithDeletedItem = [
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
                    }
                ];

                const diff: Delta = createDiffWithoutConverting(left, rightWithDeletedItem);
                expect(diff).toEqual({
                    "_t": "a",
                    "_2": [{
                        "title": "Item 3",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }, 0, 0]
                }); // DELETE WORKS
            });

            it('should be defined for different arrays (UPDATE)', function () {

                const left = [
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
                    }
                ];
                const rightWithUpdatedItem = [
                    {
                        "id": "2e8ded10-3d2c-11ea-91ec-af2b74427547",
                        "title": "Item 1",
                        "complete": false,
                        "createdAt": "2020-01-22T15:30:55.713Z",
                        "updatedAt": "2020-01-23T17:47:59.852Z"
                    }, {
                        "title": "Item 2 UPDATED",
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
                    }
                ];

                const diff: Delta = createDiffWithoutConverting(left, rightWithUpdatedItem);

                expect(diff).toEqual({"1": {"title": ["@@ -1,6 +1,14 @@\n Item 2\n+ UPDATED\n", 0, 2]}, "_t": "a"});
            });

            it('should be defined for different arrays (CREATE)', function () {

                const left = [
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
                    }
                ];
                const rightWithCreatedItem = [
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
                    }
                ];

                const diff: Delta = createDiffWithoutConverting(left, rightWithCreatedItem);

                expect(diff).toEqual({
                    "2": [{
                        "title": "Item 3",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }], "_t": "a"
                });
            });
        });

        describe('createPatchWithoutConverting() and createDiffWithoutConverting() DOES NOT WORK for Arrays, when the array which has to be patched has changed after the diff has been taken', async () => {
            it('should throw an error on patching (UPDATING) an and the array has changed (DELETING) in the meantime', function () {
                const left = [
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
                    }
                ];
                const rightWithDeletedItem = [
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
                    }
                ];

                const diff: Delta = createDiffWithoutConverting(left, rightWithDeletedItem);
                expect(diff).toEqual({
                    "_t": "a",
                    "_2": [{
                        "title": "Item 3",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }, 0, 0]
                }); // DELETE WORKS

                const leftUpdated = _.cloneDeep(left).map(item => {
                    if (item.title === 'Item 3') {
                        item.title = 'Item 3 UPDATED'
                    }
                    return item
                });
                const updatedDiff = createDiffWithoutConverting(leftUpdated, left); // Create Diff to update deleted item at next step
                expect(updatedDiff).toEqual({"2": {"title": ["@@ -3,12 +3,4 @@\n em 3\n- UPDATED\n", 0, 2]}, "_t": "a"});

                try {
                    const patch = patchIntoWithoutConverting(rightWithDeletedItem, updatedDiff);             //try to update the deleted item by patching it
                } catch (e) {
                    expect(e.message).toBe('Cannot read property \'title\' of undefined'); // -> fails because it try to update not existing index of the array
                }
            });

            it('should throw an error on patching (UPDATING) an and the array has changed (UPDATING) in the meantime', function () {
                const left = [
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
                    }
                ];
                const rightWithChangedPositionItem = [
                    {
                        "id": "2e8ded10-3d2c-11ea-91ec-af2b74427547",
                        "title": "Item 1",
                        "complete": false,
                        "createdAt": "2020-01-22T15:30:55.713Z",
                        "updatedAt": "2020-01-23T17:47:59.852Z"
                    }, {
                        "title": "Item 3",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }, {
                        "title": "Item 2 CHANGED POSITION",
                        "id": "6ea9eba0-3deb-11ea-9820-ff0194468160",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:04.950Z",
                        "createdAt": "2020-01-23T14:19:57.146Z"
                    }
                ];

                const expectedOutcome = [
                    {
                        "id": "2e8ded10-3d2c-11ea-91ec-af2b74427547",
                        "title": "Item 1",
                        "complete": false,
                        "createdAt": "2020-01-22T15:30:55.713Z",
                        "updatedAt": "2020-01-23T17:47:59.852Z"
                    }, {
                        "title": "Item 3 UPDATED",
                        "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:09.000Z",
                        "createdAt": "2020-01-23T15:26:46.696Z"
                    }, {
                        "title": "Item 2 CHANGED POSITION",
                        "id": "6ea9eba0-3deb-11ea-9820-ff0194468160",
                        "complete": false,
                        "updatedAt": "2020-01-23T17:48:04.950Z",
                        "createdAt": "2020-01-23T14:19:57.146Z"
                    }
                ];

                const diff: Delta = createDiffWithoutConverting(left, rightWithChangedPositionItem);
                expect(diff).toEqual({
                        "1": [{
                            "title": "Item 3",
                            "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                            "complete": false,
                            "updatedAt": "2020-01-23T17:48:09.000Z",
                            "createdAt": "2020-01-23T15:26:46.696Z"
                        }],
                        "2": {"title": ["@@ -1,6 +1,23 @@\n Item 2\n+ CHANGED POSITION\n", 0, 2]},
                        "_t": "a",
                        "_2": [{
                            "title": "Item 3",
                            "id": "c48ab280-3df4-11ea-8e4f-ab4cbb7ac244",
                            "complete": false,
                            "updatedAt": "2020-01-23T17:48:09.000Z",
                            "createdAt": "2020-01-23T15:26:46.696Z"
                        }, 0, 0]
                    }
                ); // CHANGING POSITIONS WORKS

                const leftUpdated = _.cloneDeep(left).map(item => {
                    if (item.title === 'Item 3') {
                        item.title = 'Item 3 UPDATED'
                    }
                    return item
                });
                const updatedDiff = createDiffWithoutConverting(left, leftUpdated);
                expect(updatedDiff).toEqual({"2":{"title":["@@ -1,6 +1,14 @@\n Item 3\n+ UPDATED\n",0,2]},"_t":"a"});

                const patch = patchIntoWithoutConverting(rightWithChangedPositionItem, updatedDiff);
                expect(patch).not.toEqual(expectedOutcome); // Final patch does not work -> Outcome would be $[1].title = 'Item 3' to equal 'Item 3 UPDATED' and $[2].title = 'Item  UPDATED2 CHANGED POSITION' to equal 'Item 2 CHANGED POSITION' but should be expectedOutcome
            });
        });
    });
});