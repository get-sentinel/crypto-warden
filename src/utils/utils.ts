import { Dimensions, Linking } from 'react-native';
import Wallet from '../class/Wallet';
import { TOAST_POSITION, WALLET_PROVIDERS } from './constants';
import { Dispatch } from 'react';
import { addNewWallet } from '../redux/WalletSlice';
import Toast from 'react-native-toast-message';

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
            return w.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))
        case 3: // Alphabetical descending
            return w.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)).reverse()
    }
}

export const analyzeSeed = (nextValue: string, setStatus: (status: number) => void) => {

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

export const findProviderIdByName = (name: string) => {
    const walletProvider = WALLET_PROVIDERS.find(
        provider => provider.name.toLowerCase() === name.toLowerCase()
    );
    return walletProvider ? walletProvider.id : 0;
}

export const addNewWalletFromURL = (dispatch: Dispatch<any>, url: string, wallets: Wallet[], synchronizable: boolean) => {
    // Split the URL by "//" to get the wallet name and remaining string
    const parts = url.split('//');

    if (parts.length !== 2) {
        console.error('Invalid URL format');
    }

    // Get the wallet name by splitting the remaining string by "?" and taking the first part
    const walletName = parts[1].split('?')[0] ?? "My Wallet";

    // Get the query string by splitting the remaining string by "?"
    const queryString = parts[1].split('?')[1];

    // Parse the query string into an object with key-value pairs
    const query: { [key: string]: string } = {};
    queryString.split('&').forEach((item) => {
        const [key, value] = item.split('=');
        query[key] = decodeURIComponent(value);
    });

    // Get the seed (mandatory field)
    const seed = query.seed;

    if (!seed) {
        Toast.show({
            type: 'success',
            position: TOAST_POSITION,
            text1: 'Could not import wallet',
            text2: 'The seed is either missing or malformed',
            visibilityTime: 2000,
            autoHide: true,
            topOffset: 30,
            bottomOffset: 40,
            onShow: () => { },
            onHide: () => { },
            onPress: () => { },
            props: { iconName: 'cancel' }
        })
        return
    }

    // Get the provider (optional field)
    const provider = query.provider;

    // Get the address (optional field)
    const address = query.address;

    // Get the password (optional field)
    const password = query.password;

    let newWallet = new Wallet({
        provider: provider ? findProviderIdByName(provider) : 0,
        seed: seed,
        name: walletName,
        address: address,
        password: password,
        id: getMaxNumberFromArray(wallets.map((w: Wallet) => w.id)),
        isDeleted: false,
        createDate: new Date(),
        updateDate: new Date()
    })

    dispatch(addNewWallet({ newWallet: newWallet, synchronizable: synchronizable }))
}