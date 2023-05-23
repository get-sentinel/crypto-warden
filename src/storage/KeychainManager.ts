import { Dispatch } from 'redux';
import Wallet from '../class/Wallet';
import { loadWallets } from '../redux/WalletSlice';
import { NativeModules } from "react-native";
import { mergeWallets } from './StorageManager';
import { KEYCHAIN_KEY } from '../utils/constants';

const { KeychainWrapper } = NativeModules;

export const setValueForKey = ({ key, value, synchronizable = true }: { key: string, value: string, synchronizable: boolean }) => {
    return KeychainWrapper.setValueForKey(value, key, synchronizable)
}

export const getValueForKey = ({ key, synchronizable = true }: { key: string, synchronizable: boolean }) => {
    return KeychainWrapper.getValueForKey(key, synchronizable)
};