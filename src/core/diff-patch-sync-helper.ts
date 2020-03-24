import {Config, create, Delta, DiffPatcher} from "jsondiffpatch";
import * as _ from 'lodash'
import {DiffPatchSyncConstraints, Edit, EditsDTO} from "./diff-patch-sync-interfaces";

export class DiffPatchSyncHelper<T extends DiffPatchSyncConstraints> {

    diffMatchPatch: DiffPatcher;
    diffPatchOptions: Config = {
        textDiff: {
            // default 60, minimum string length (left and right sides) to use text diff algorythm: google-diff-match-patch
            minLength: 5
        }
    };

    constructor(diffPatchOptions: Config = undefined) {
        if (diffPatchOptions) {
            this.diffPatchOptions = diffPatchOptions;
        }
        this.diffMatchPatch = new DiffPatcher(this.diffPatchOptions);
    }

    patchInto(document: T[], diffs: Delta, lastStateContainingItem: T[] = undefined): T[] {

        let doc:T = this.convertArrayToObject(_.cloneDeep(document), 'id');
        let patch;

        try {
            patch = this.diffMatchPatch.patch(doc, diffs);
        } catch (e) {

            if (!lastStateContainingItem) {
                throw Error(`Could not execute patch with: 
                Diffs: ${JSON.stringify(diffs)}
                Document: ${JSON.stringify(document)}
                Provide some previous state of the document which contains the affected id to recover the item!` )
            }
            doc = this.recoverDeletedItems(diffs, document, lastStateContainingItem, doc);
            patch = this.diffMatchPatch.patch(doc, diffs);
        }

        return this.convertObjectToArray(patch) as T[];
    }

    recoverDeletedItems(diffs: Delta, document: T[], lastStateContainingItem: T[], doc: T): T {
        const diffsIds: string[] = Object.getOwnPropertyNames(diffs);
        const deletedItemIds = diffsIds.filter(id => !document.map(item => item.id).includes(id));
        const toRecoverItems: T[] = lastStateContainingItem.filter(t => deletedItemIds.includes(t.id));
        toRecoverItems.forEach(item => doc[item.id] = _.cloneDeep(item));
        return doc;
    }

    createDiff(left: T[], right: T[]): Delta {

        const doc1 = this.convertArrayToObject(_.cloneDeep(left), 'id');
        const doc2 = this.convertArrayToObject(_.cloneDeep(right), 'id');

        return this.diffMatchPatch.diff(doc1, doc2);
    }

    createEdit(diff: Delta, remoteVersion: number, localVersion: number): Edit {
        return {
            remoteVersion,
            localVersion,
            diff
        };
    }

    createMessage(edits: Edit[], remoteVersion: number, localVersion: number, clientReplicaId: string): EditsDTO {
        return {
            clientReplicaId,
            edits,
            localVersion,
            remoteVersion,
        };
    }

    private convertObjectToArray = (obj) => Object.values(obj).map((value, _) => value);

    private convertArrayToObject = (arr, keyField) => Object.assign({}, ...arr.map(item => ({[item[keyField]]: item})));
}








