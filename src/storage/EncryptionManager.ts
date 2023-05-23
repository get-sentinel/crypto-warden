import { NativeModules, Platform } from 'react-native'
import Aes from 'react-native-aes-crypto'
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry'
import { LOCAL_STORAGE_KEYS } from '../utils/constants'
import { getFromLocalStorage } from './StorageManager'

export const generateKey = (password: string, salt: string, cost: number, length: number) => Aes.pbkdf2(password, salt, cost, length)

export const encryptData = async ({ value, password, uid }: { value: string, password?: string, uid:string }) => {
    var verifiedPassword = password ?? await getFromLocalStorage({ key: LOCAL_STORAGE_KEYS.PASSWORD })
    if (!verifiedPassword) {
        console.log("No password was found")
        return
    }

    let key = await generateKey(verifiedPassword, uid, 500, 256)

    return Aes.randomKey(16).then(iv => {
        return Aes.encrypt(value, key, iv, 'aes-256-cbc').then(cipher => ({
            cipher,
            iv,
        }))
    })
}

export const decryptData = async ({ encryptedData, password, uid }: { encryptedData: { cipher: any; iv: any }, password?: string, uid: string }) => {
    var verifiedPassword = password ?? await getFromLocalStorage({ key: LOCAL_STORAGE_KEYS.PASSWORD })
    if (!verifiedPassword) {
        return undefined
    }
    let key = await generateKey(verifiedPassword, uid, 500, 256)

    return Aes.decrypt(encryptedData.cipher, key, encryptedData.iv, 'aes-256-cbc')
}