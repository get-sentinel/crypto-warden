import { Dispatch } from 'redux';
import Wallet from '../class/Wallet';
import { loadWallets } from '../redux/WalletSlice';
import { KEYCHAIN_PATHS } from '../utils/constants';
import { getMaxNumberFromArray } from '../utils/utils';
import { NativeModules } from "react-native";

const { KeychainWrapper } = NativeModules;

export const setValueForKey = (key: string, value: string, synchronizable: boolean) => {
    return KeychainWrapper.setValueForKey(value, key, synchronizable)
}

export const getValueForKey = (key: string, synchronizable: boolean) => {
    return KeychainWrapper.getValueForKey(key, synchronizable)
}

export const setWalletsToKeychain = (wallets: Wallet[], synchronizable: boolean = false) => {
    let unwrappedWallets = wallets.map(wallet => wallet.getWallet())
    let stringifiedWallets = JSON.stringify(unwrappedWallets)
    return setValueForKey(KEYCHAIN_PATHS.WALLETS, stringifiedWallets, synchronizable)
}

export const getWalletsFromKeychain = (dispatch: Dispatch<any>, synchronizable: boolean = true) => {
    let value = getValueForKey(KEYCHAIN_PATHS.WALLETS, synchronizable)
    if (value === '' || value === '[]') {
        console.log("Keychain is empty")
        dispatch(loadWallets([]))
    } else {
        let stringifiedWallets = value
        var walletsArray: Wallet[] = JSON.parse(stringifiedWallets)

        // Correct any missing ids to avoid errors during updates
        for (var wallet of walletsArray) {
            if (!wallet.id) {
                wallet.id = getMaxNumberFromArray(walletsArray.map(w => w.id))
            }
        }

        // Map to wallet class obkects
        walletsArray = walletsArray.map(wallet => new Wallet({
            provider: wallet.provider,
            seed: wallet.seed,
            name: wallet.name,
            address: wallet.address,
            password: wallet.password,
            id: wallet.id
        }))

        dispatch(loadWallets(walletsArray))
    }
}