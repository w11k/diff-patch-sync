import {Config, Delta} from "jsondiffpatch";
import * as _ from 'lodash'
import {DiffPatchSyncHelper} from "../core/diff-patch-sync-helper";
import {
    DiffPatchSyncConstraints,
    Edit,
    EditsDTO, PersistenceAdapter,
    Shadow,
} from "../core/diff-patch-sync-interfaces";

/*
*    This will create a new server.
*
*    @typeparam T                               The type parameter 'T' is generic, so pass your own interface/class for type safety.
*    @param dataAdapter                         The 'dataAdapter' parameter is the persistence adapter for server-side storage
*    @param diffPatchOptions                    The ´diffPatchOptions´ parameter is optional and you can pass your own options for the diff patch algorithm (see https://github.com/benjamine/jsondiffpatch#options)
*/
export class DiffPatchSyncServer<T extends DiffPatchSyncConstraints> {

    dataAdapter: PersistenceAdapter<T>;
    diffPatchSyncHelper: DiffPatchSyncHelper<T>;

    constructor(
        dataAdapter: PersistenceAdapter<T>,
        private diffPatchOptions: Config = undefined
    ) {
        this.dataAdapter = dataAdapter;
        this.diffPatchSyncHelper = new DiffPatchSyncHelper(diffPatchOptions);
    }

    async addClientShadow(clientShadow: Shadow<T>) {
        return await this.dataAdapter.saveShadow(clientShadow);
    }

    async getClientShadowById(clientReplicaId: string): Promise<Shadow<T>> | undefined {
        return await this.dataAdapter.findShadowById(clientReplicaId);
    }

    async getClientShadows(): Promise<Shadow<T>[]> | undefined {
        return await this.dataAdapter.findAllShadows();
    }

    async updateClientShadow(clientShadow: Shadow<T>) {
        return await this.dataAdapter.updateShadow(clientShadow);
    }

    async getServerCopy(): Promise<T[]> {
        return await this.dataAdapter.findAllItems();
    }

    async updateServerCopy(serverCopy: T[], serverCopyBeforeSync: T[]) {
        const serverCopyDiffs: Delta = this.diffPatchSyncHelper.createDiff(serverCopyBeforeSync, serverCopy);
        if (!_.isEmpty(serverCopyDiffs)) {
            return await this.executeServerCopyOperations(serverCopyDiffs, serverCopy, serverCopyBeforeSync);
        }
    }

    /*
    *    After hitting the server endpoint only the 'sync' function must be called.
    *
    *
    *    @param editMessage     The 'clientMessage' parameter is the body from the clients request
    *    @returns               Returns a Promise of a new EditsDTO for the client which contains the version numbers and possible server side changes
    */
    async sync(clientMessage: EditsDTO): Promise<EditsDTO> {

        const clientReplicaId: string = clientMessage.clientReplicaId;
        const serverCopyBeforeSync: T[] = await this.getServerCopy();
        const clientShadowBeforeSync: Shadow<T> = await this.getClientShadowById(clientMessage.clientReplicaId);
        let clientShadow: Shadow<T> = _.cloneDeep(clientShadowBeforeSync);
        let serverCopy: T[] = _.cloneDeep(serverCopyBeforeSync);
        let serverMessage: EditsDTO;

        if (!clientShadow) {
            clientShadow = await this.createNewClientShadow(clientReplicaId, clientMessage);
        }

        clientMessage.edits.forEach((edit: Edit) => {
            if(edit.remoteVersion === clientShadow.remoteVersion && edit.localVersion === clientShadow.localVersion) {
                clientShadow.shadowCopy = this.diffPatchSyncHelper.patchInto(clientShadow.shadowCopy, edit.diff);
                clientShadow.localVersion++;
                serverCopy = this.diffPatchSyncHelper.patchInto(serverCopy, edit.diff, clientShadowBeforeSync.shadowCopy);
            } else {
                this.logEditAlreadyApplied(edit.remoteVersion, clientShadow.remoteVersion, edit.localVersion, clientShadow.localVersion);
            }
        });

        const serverDiffs: Delta = this.diffPatchSyncHelper.createDiff(clientShadow.shadowCopy, serverCopy);
        const basedOnRemoteVersion = clientShadow.remoteVersion;
        const basedOnLocalVersion = clientShadow.localVersion;

        if (!_.isEmpty(serverDiffs)) {
            const edit: Edit = this.diffPatchSyncHelper.createEdit(serverDiffs, basedOnRemoteVersion, basedOnLocalVersion);
            serverMessage = this.diffPatchSyncHelper.createMessage([edit], basedOnRemoteVersion, basedOnLocalVersion, clientReplicaId);
            clientShadow.remoteVersion++;
            clientShadow.shadowCopy = this.diffPatchSyncHelper.patchInto(clientShadow.shadowCopy, serverDiffs);
        } else {
            serverMessage = this.diffPatchSyncHelper.createMessage([], basedOnRemoteVersion, basedOnLocalVersion, clientReplicaId);
        }

        await this.updateClientShadow(clientShadow);
        await this.updateServerCopy(serverCopy, serverCopyBeforeSync);

        return serverMessage;
    }

    async createNewClientShadow(clientReplicaId: string, editMessage: EditsDTO): Promise<Shadow<T>> {
        const newShadow: Shadow<T> = {
            clientReplicaId,
            remoteVersion: editMessage.remoteVersion,
            localVersion: editMessage.localVersion,
            shadowCopy: []
        };
        await this.addClientShadow(newShadow);
        return newShadow;
    }

    async executeServerCopyOperations(diffs: Delta, newState: T[], oldState: T[]) {

        const diffsIds: string[] = Object.getOwnPropertyNames(diffs);
        const oldStateIds: string[] = oldState.map(item => item.id);
        const newStateIds: string[] = newState.map(item => item.id);

        // updated items occur in the old state, the new state and the diffs
        const toUpdateItems: T[] = newState.filter(elem => (diffsIds.includes(elem.id) && oldStateIds.includes(elem.id)));

        // to create items don't occur in the old state, but in new state and diffs
        const toCreateItems: T[] = newState.filter(elem => (diffsIds.includes(elem.id) && !oldStateIds.includes(elem.id)));

        // to delete items don't occur in the new state, but in the old state and diffs
        const toDeleteItems: T[] = oldState.filter(elem => (diffsIds.includes(elem.id) && !newStateIds.includes(elem.id)));

        for (const item of toUpdateItems) {
            await this.dataAdapter.updateItem(item)
        }

        for (const item of toCreateItems) {
            await this.dataAdapter.saveItem(item)
        }

        for (const item of toDeleteItems) {
            await this.dataAdapter.deleteItem(item)
        }
    }

    logEditAlreadyApplied(editRemoteVersion, shadowRemoteVersion, editLocalVersion, shadowLocalVersion) {
        console.log('previous response must have been lost -> edit with the following version numbers is already applied:');
        console.log(`editRemoteVersion: ${editRemoteVersion}, shadowRemoteVersion: ${shadowRemoteVersion}, editLocalVersion: ${editLocalVersion}, shadowLocalVersion: ${shadowLocalVersion}`);
    }
}
