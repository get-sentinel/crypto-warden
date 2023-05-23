import { Platform } from "react-native";
import Wallet from "../class/Wallet";
import { E_STORAGE_KEY, KEYCHAIN_KEY, LOCAL_STORAGE_KEYS, SECURITY_OPTIONS, SENTINEL_CLOUD_KEY } from "../utils/constants";
import * as EncryptedStorageManager from './EncryptedStorageManager'
import * as KeychainManager from './KeychainManager';
import * as FirestoreManager from '../firebase/firestore';
import { Dispatch } from "react";
import { loadWallets } from "../redux/WalletSlice";
import { setPassword, setSecurityOption } from "../redux/AccountSlice";

export const mergeWallets = (local: Wallet[], remote: Wallet[]): Wallet[] => {
    const mergedWallets: Wallet[] = [];

    // First add all wallets from the remote array
    for (const remoteWallet of remote) {
        const matchingLocalWallet = local.find(localWallet => localWallet.seed === remoteWallet.seed);
        if (matchingLocalWallet && new Date(matchingLocalWallet.updateDate) > new Date(remoteWallet.updateDate)) {
            // Keep the local wallet if it's more updated
            mergedWallets.push(matchingLocalWallet);
        } else {
            // Otherwise, add the remote wallet
            mergedWallets.push(remoteWallet);
        }
    }

    // Then add all remaining wallets from the local array
    for (const localWallet of local) {
        const matchingMergedWallet = mergedWallets.find(mergedWallet => mergedWallet.seed === localWallet.seed);
        if (!matchingMergedWallet) {
            mergedWallets.push(localWallet);
        }
    }

    return mergedWallets;
}

const getWalletsFromString = (valueString: string) => {
    const remoteWallets: Wallet[] = JSON.parse(valueString);

    // Correct any missing ids to avoid errors during updates
    const updatedRemoteWallets = remoteWallets.map((wallet) => ({
        ...wallet,
        id: wallet.id || Math.max(...Array.from(remoteWallets, (w) => w.id ?? 0)) + 1,
    }));

    // Map to wallet class objects
    const remoteWalletInstances = updatedRemoteWallets.map((wallet) => new Wallet({
        provider: wallet.provider,
        seed: wallet.seed,
        name: wallet.name,
        address: wallet.address,
        password: wallet.password,
        id: wallet.id,
        isDeleted: wallet.isDeleted,
        createDate: wallet.createDate,
        updateDate: wallet.updateDate,
    }));

    return remoteWalletInstances
}

export const getDataFromRemote = async ({ securityOption, uid, password }: { securityOption: string, uid: string, password?: string }) => {
    var valueString = undefined

    switch (securityOption) {
        case SECURITY_OPTIONS.SENTINEL:
            valueString = await FirestoreManager.getEncryptedValueForKey({ uid: uid, key: SENTINEL_CLOUD_KEY.WALLETS, password: password })
            break;
        case SECURITY_OPTIONS.E_STORAGE:
            valueString = await EncryptedStorageManager.getValueForKey({ key: E_STORAGE_KEY.WALLETS })
            break;
        case SECURITY_OPTIONS.ICLOUD:
        default:
            valueString = KeychainManager.getValueForKey({ key: KEYCHAIN_KEY.WALLETS, synchronizable: true })
            break;
    }

    var remote: Wallet[] = valueString ? getWalletsFromString(valueString) : []
    return remote
}

export const setDataToRemote = async ({ securityOption, uid, value }: { securityOption: string, uid: string, value: string }) => {
    var success = false
    switch (securityOption) {
        case SECURITY_OPTIONS.ICLOUD:
            success = KeychainManager.setValueForKey({ key: KEYCHAIN_KEY.WALLETS, value: value, synchronizable: true })
            break;
        case SECURITY_OPTIONS.SENTINEL:
            success = await FirestoreManager.setEncryptedValueForKey({ uid: uid, key: SENTINEL_CLOUD_KEY.WALLETS, value: value })
            break;
        case SECURITY_OPTIONS.E_STORAGE:
            success = await EncryptedStorageManager.setValueForKey({ key: E_STORAGE_KEY.WALLETS, value: value })
            break;
    }
    return success
}

export const setToLocalStorage = async ({ key, value }: { key: string, value: string }) => {
    try {
        if (Platform.OS === 'android') {
            await EncryptedStorageManager.setValueForKey({ key: key, value: value })
        } else {
            KeychainManager.setValueForKey({ key: key, value: value, synchronizable: false })
        }
        return true
    } catch (error) {
        return false
    }
}


export const getFromLocalStorage = async ({ key }: { key: string }) => {
    var value = undefined
    if (Platform.OS === 'android') {
        value = await EncryptedStorageManager.getValueForKey({ key: key })
    } else {
        value = KeychainManager.getValueForKey({ key: key, synchronizable: false })
    }
    return value
}

export const getWalletsAndDispatch = async ({ dispatch, local = [], securityOption, uid }: { dispatch: Dispatch<any>, local?: Wallet[], securityOption: string, uid: string }) => {
    let remote = await getDataFromRemote({ securityOption: securityOption, uid: uid })

    if (local.length > 0) {
        const mergedWallets = mergeWallets(local, remote);
        dispatch(loadWallets(mergedWallets));
        return;
    }

    dispatch(loadWallets(remote));
}

export const switchSecureStorage = async ({ local, oldSecurityOption, newSecurityOption, newPassword, oldPassword, uid, setStatusMessage, deleteOrigin, dispatch }: { local: Wallet[], oldSecurityOption: string, newSecurityOption: string, newPassword: string, oldPassword: string, uid: string, dispatch:Dispatch<any>, setStatusMessage: (message: string) => void, deleteOrigin: boolean }) => {

    var statusMessage = 'Migration started...\n\n'
    setStatusMessage(statusMessage)
    var success = false

    let password = oldPassword ?? newPassword

    // Get data from remote to avoid losing data
    let remote = await getDataFromRemote({ securityOption: newSecurityOption, uid: uid, password: password })
    statusMessage = statusMessage + "Data fetched from remote, found " + remote.length + " wallets ✅\n\n"
    setStatusMessage(statusMessage)

    // Merge with local data
    let mergedWallets = mergeWallets(local, remote);
    statusMessage = statusMessage + "Merged with local data, total " + mergedWallets.length + " wallets ✅\n\n"
    setStatusMessage(statusMessage)

    // Stringify before storing to new location
    let value = JSON.stringify(mergedWallets)

    if (oldPassword !== newPassword) {
        // Update password locally
        success = await setToLocalStorage({ key: LOCAL_STORAGE_KEYS.PASSWORD, value: newPassword })
        if (success) {
            statusMessage = statusMessage + "Stored new password locally ✅\n\n"
            setStatusMessage(statusMessage)
            dispatch(setPassword(password))
        } else {
            statusMessage = statusMessage + "Could not store new password locally, iterrupting ❌\n\n"
            setStatusMessage(statusMessage)
            return
        }
    }

    // Save data to new location
    success = await setDataToRemote({ securityOption: newSecurityOption, uid: uid, value: value })

    if (success) {
        statusMessage = statusMessage + "Saved data to new location ✅\n\n"
        setStatusMessage(statusMessage)
    } else {
        statusMessage = statusMessage + "Error while storing to new location, iterrupting ❌\n\n"
        setStatusMessage(statusMessage)
        return
    }

    // Save security option to local storage
    success = await setToLocalStorage({ key: LOCAL_STORAGE_KEYS.SECURITY_OPTION, value: newSecurityOption })
    if (success) {
        statusMessage = statusMessage + "Saved new Security Option ✅\n\n"
        setStatusMessage(statusMessage)
        dispatch(setSecurityOption(newSecurityOption))
    } else {
        statusMessage = statusMessage + "Error while updating Security Option to new location, iterrupting ❌\n\n"
        setStatusMessage(statusMessage)
        return
    }

    // Remove data from old location
    if (deleteOrigin) {
        success = await setDataToRemote({ securityOption: oldSecurityOption, uid: uid, value: '' })

        if (success) {
            statusMessage = statusMessage + "Cleaned data from old location ✅\n\n"
            setStatusMessage(statusMessage)
        } else {
            statusMessage = statusMessage + "Error while cleaning data from old location, iterrupting ❌\n\n"
            setStatusMessage(statusMessage)
            return
        }
    }
}

export const saveWallets = async ({ local, securityOption, uid }: { local: Wallet[], securityOption: string, uid: string }) => {

    let remote = await getDataFromRemote({ securityOption: securityOption, uid: uid })
    let mergedWallets = mergeWallets(local, remote);

    let unwrappedWallets = mergedWallets.map(wallet => wallet.getWallet())
    let stringifiedWallets = JSON.stringify(unwrappedWallets)
    return setDataToRemote({ securityOption: securityOption, uid: uid, value: stringifiedWallets })
}