import { Platform } from "react-native";
import Wallet from "../class/Wallet";
import { E_STORAGE_KEY, KEYCHAIN_KEY, LOCAL_STORAGE_KEYS, SECURITY_OPTIONS, SECURITY_OPTION_DISPLAY_NAMES, SENTINEL_CLOUD_KEY } from "../utils/constants";
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

export const switchSecureStorage = async ({ local, oldSecurityOption, newSecurityOption, newPassword, oldPassword, uid, statusMessage, setStatusMessage, deleteOrigin, dispatch }: { local: Wallet[], oldSecurityOption: string, newSecurityOption: string, newPassword: string, oldPassword: string, uid: string, dispatch: Dispatch<any>, statusMessage: string[], setStatusMessage: (messageList: string[]) => void, deleteOrigin: boolean }) => {

    statusMessage.push('Migration started...')
    setStatusMessage(statusMessage)
    var success = false

    let password = oldPassword ?? newPassword

    // Get data from remote to avoid losing data
    let remote = await getDataFromRemote({ securityOption: newSecurityOption, uid: uid, password: password })
    statusMessage.push(`✅ Data fetched from ${SECURITY_OPTION_DISPLAY_NAMES[oldSecurityOption]}, found ` + remote.length + " wallets")
    setStatusMessage(statusMessage)

    // Merge with local data
    let mergedWallets = mergeWallets(local, remote);
    statusMessage.push("✅ Merged with local data, total " + mergedWallets.length + " wallets")
    setStatusMessage(statusMessage)

    // Stringify before storing to new location
    let value = JSON.stringify(mergedWallets)

    if (oldPassword !== newPassword) {
        // Update password locally
        success = await setToLocalStorage({ key: LOCAL_STORAGE_KEYS.PASSWORD, value: newPassword })
        if (success) {
            statusMessage.push("✅ Stored new password locally")
            setStatusMessage(statusMessage)
            dispatch(setPassword(newPassword))
        } else {
            statusMessage.push("❌ Could not store new password locally, iterrupting")
            setStatusMessage(statusMessage)
            return
        }
    }

    // Save data to new location
    success = await setDataToRemote({ securityOption: newSecurityOption, uid: uid, value: value })

    if (success) {
        statusMessage.push(`✅ Saved data to ${SECURITY_OPTION_DISPLAY_NAMES[newSecurityOption]}`)
        setStatusMessage(statusMessage)
    } else {
        statusMessage.push(`❌ Error while storing to ${SECURITY_OPTION_DISPLAY_NAMES[newSecurityOption]}, iterrupting`)
        setStatusMessage(statusMessage)
        return
    }

    // Save security option to local storage
    success = await setToLocalStorage({ key: LOCAL_STORAGE_KEYS.SECURITY_OPTION, value: newSecurityOption })
    if (success) {
        statusMessage.push(`✅ Saved ${SECURITY_OPTION_DISPLAY_NAMES[newSecurityOption]} as new Security Option`)
        setStatusMessage(statusMessage)
        dispatch(setSecurityOption(newSecurityOption))
    } else {
        statusMessage.push(`❌ Error while updating Security Option to ${SECURITY_OPTION_DISPLAY_NAMES[newSecurityOption]}, iterrupting`)
        setStatusMessage(statusMessage)
        return
    }

    // Remove data from old location
    if (deleteOrigin) {
        success = await setDataToRemote({ securityOption: oldSecurityOption, uid: uid, value: '' })

        if (success) {
            statusMessage.push(`✅ Cleaned data from ${SECURITY_OPTION_DISPLAY_NAMES[oldSecurityOption]}`)
            setStatusMessage(statusMessage)
        } else {
            statusMessage.push(`❌ Error while cleaning data from ${SECURITY_OPTION_DISPLAY_NAMES[oldSecurityOption]}, iterrupting`)
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