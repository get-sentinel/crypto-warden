import firestore from '@react-native-firebase/firestore';
import { decryptData, encryptData } from '../storage/EncryptionManager';
import Toast from 'react-native-toast-message';
import { COLLECTION, TOAST_POSITION, c } from '../utils/constants';
import { err } from 'react-native-svg/lib/typescript/xml';


export const setEncryptedValueForKey = async ({ uid, key, value, password }: { uid: string, key: string, value: string, password?: string }) => {

    try {
        var eValue = await encryptData({ value: value, password: password, uid: uid })

        await firestore().collection(COLLECTION.DATA).doc(uid).set({
            [key]: { ...eValue, updateDate: new Date() },
        }, { merge: true })

        return true
    } catch (error) {
        console.error("Failed to set encrypted data to Firestore: ", error)
        return false
    }
}


export const getEncryptedValueForKey = async ({ uid, key, password }: { uid: string, key: string, password?: string }) => {

    const snapshot = await firestore()
        .collection(COLLECTION.DATA)
        .doc(uid)
        .get()

    let value = snapshot.data()?.[key]
    if (!value) {
        return undefined
    }
    
    try {
        var dValue = await decryptData({ encryptedData: value, password: password, uid: uid })
        return dValue
    }
    catch (error) {
        console.log(error)
        return undefined
    }
}
