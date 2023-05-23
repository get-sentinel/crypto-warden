import { err } from "react-native-svg/lib/typescript/xml";
import Wallet from "../class/Wallet"
import EncryptedStorage from 'react-native-encrypted-storage';

export const getValueForKey = async ({ key }: { key: string }) => {
    try {
        const value = await EncryptedStorage.getItem(key);
        return value;
    } catch (error) {
        console.log(error)
    }
}

export const setValueForKey = async ({ key, value }: { key: string, value: string }) => {
    try {
        await EncryptedStorage.setItem(key, value)
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}