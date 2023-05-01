import { Dimensions, Linking } from 'react-native';
import Wallet from '../class/Wallet';
import { WALLET_PROVIDERS } from './constants';

export const cropWalletAddress = (address: string) => {
    let length = address.length
    return address.slice(0, 4) + '...' + address.slice(length - 4, length)
}

export const isSmallScreen = () => {
    if (Dimensions.get('screen').height < 812) {
        return true
    }
    return false
}

export const getProviderName = (providerId: number) => {
    return WALLET_PROVIDERS.filter(w => w.id === providerId)[0].name ?? 'Unknown'
}

export const getProviderImagePath = (providerId: number) => {
    return WALLET_PROVIDERS.filter(w => w.id === providerId)[0].imagePath ?? 'Unknown'
}

export const getMaxNumberFromArray = (array: number[]) => {
    let newId = array.filter(o => o !== null && o !== undefined).sort((a, b) => b - a)[0] + 1
    return !newId || isNaN(newId) ? 0 : newId
}

export const openURL = (url: string) => {
    Linking.canOpenURL(url).then(supported => {
        if (supported) {
            Linking.openURL(url);
        } else {
            console.log("Don't know how to open URI: " + url);
        }
    });
}

export const getNextSorting = (sorting: number) => {
    switch (sorting) {
        case 0:
            return 1
        case 1:
            return 2
        case 2:
            return 3
        case 3:
        default:
            return 0
    }
}

export const sortWallets = (wallets: Wallet[], sorting: number) => {
    let w: Wallet[] = Object.assign([], wallets.filter(wallet => !wallet.isDeleted));
    switch (sorting) {
        case 0: // Calendar ascending
        default:
            return w
        case 1: // Calendar descending
            return w.reverse();
        case 2: // Alphabetical ascending
            return w.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))
        case 3: // Alphabetical descending
            return w.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)).reverse()
    }
}

export const analyzeSeed = (nextValue: string, setStatus: (status:number) => void) => {

    // Check that the string is not empty
    if (nextValue === '') {
        setStatus(0)
        return
    }

    // Check that the string does not start with a space
    if (nextValue.charAt(0) === " " || nextValue.charAt(nextValue.length - 1) === " ") {
        setStatus(2)
        return
    }

    // Check that the string contains 12 words
    const words = nextValue.split(" ");
    if (words.length !== 12) {
        setStatus(1)
        return
    }

    // Check that the string does not contain special characters
    const regex = /^[a-zA-Z0-9\s]*$/;
    if (!regex.test(nextValue)) {
        setStatus(3)
        return
    }

    setStatus(4)
}