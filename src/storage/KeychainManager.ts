import { Dispatch } from 'redux';
import Wallet from '../class/Wallet';
import { loadWallets } from '../redux/WalletSlice';
import { KEYCHAIN_PATHS } from '../utils/constants';
import { getMaxNumberFromArray } from '../utils/utils';
import { NativeModules } from "react-native";
import EncryptedStorage from 'react-native-encrypted-storage';

const { KeychainWrapper } = NativeModules;

export const setValueForKey = async (key: string, value: string, synchronizable: boolean) => {
    // return KeychainWrapper.setValueForKey(value, key, synchronizable)

    try {
        EncryptedStorage.setItem(key, value);
      } catch (e) {
        console.log(e);
      }
}

export const getValueForKey = async (key: string, synchronizable: boolean) => {
    try {
        const value = EncryptedStorage.getItem(key);
        console.log("99998",value)
      return value;
    } catch (e) {
        console.log(e);
        console.log("99998",e)
      return null;
    }
  };
  

export const setWalletsToKeychain = async (localWallets: Wallet[], synchronizable: boolean = false) => {

    var walletsToSave = localWallets

    if (synchronizable) {
        let remoteWallets = await getWalletsFromKeychain({ synchronizable: synchronizable })
        walletsToSave = mergeWallets(localWallets, remoteWallets);
    }

    let unwrappedWallets = walletsToSave.map(wallet => wallet.getWallet())
    let stringifiedWallets = JSON.stringify(unwrappedWallets)
    return setValueForKey(KEYCHAIN_PATHS.WALLETS, stringifiedWallets, synchronizable)
}

export const getWalletsFromKeychain = async ({ synchronizable = true }: { synchronizable?: boolean }) => {
    const value = await getValueForKey(KEYCHAIN_PATHS.WALLETS, synchronizable);
    if (value === null || value === '') {
        console.log('Keychain is empty');
        return []
    }

    const remoteWallets: Wallet[] = JSON.parse(value);

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
};

export const fetchWallets = async ({ dispatch, synchronizable, localWallets = [] }: { dispatch: Dispatch<any>, synchronizable?: boolean, localWallets?: Wallet[] }) => {
    let remoteWallets = await getWalletsFromKeychain({ synchronizable: synchronizable })

    if (localWallets?.length > 0) {
        const mergedWallets = mergeWallets(localWallets, remoteWallets);
        dispatch(loadWallets(mergedWallets));
        return;
    }

    dispatch(loadWallets(remoteWallets));
}


const mergeWallets = (local: Wallet[], remote: Wallet[]): Wallet[] => {
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