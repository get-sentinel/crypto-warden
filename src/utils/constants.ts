import METAMASK_IMAGE from '../assets/walletIcons/metamask.png'
import PHANTOM_IMAGE from '../assets/walletIcons/phantom.png'
import CRYPTOCOMDEFI_IMAGE from '../assets/walletIcons/cryptocomdefi.png'
import KEPLR_IMAGE from '../assets/walletIcons/keplr.png'
import EXODUS_IMAGE from '../assets/walletIcons/exodus.png'
import PETRA_IMAGE from '../assets/walletIcons/petra.png'
import TRUSTWALLET_IMAGE from '../assets/walletIcons/trustwallet.png'
import COINOMI_IMAGE from '../assets/walletIcons/coinomi.png'
import SUI_IMAGE from '../assets/walletIcons/sui.png'
import TERRASTATION_IMAGE from '../assets/walletIcons/terrastation.png'
import MYETHERWALLET_IMAGE from '../assets/walletIcons/myetherwallet.png'
import COINBASEWALLET_IMAGE from '../assets/walletIcons/coinbasewallet.png'
import AIRGAP_IMAGE from '../assets/walletIcons/airgap.png'
import KEEPKEY_IMAGE from '../assets/walletIcons/keepkey.png'
import TREZOR_IMAGE from '../assets/walletIcons/trezor.png'
import LEDGER_IMAGE from '../assets/walletIcons/ledger.png'
import BLUE_IMAGE from '../assets/walletIcons/blue.png'
import ATOMIC_IMAGE from '../assets/walletIcons/atomic.png'
import XDEFI_IMAGE from '../assets/walletIcons/xdefi.png'
import APP_ICON_IMAGE from '../assets/app-icon.png'
import { Platform } from 'react-native'

export const APP_STORE_IOS_ID = "1663191731"

export const c = 0
export const DESKTOP = 'Desktop'

export const PAGES = {
    "HOME": "home",
    "ADD": "add",
    "WALLET_DETAILS": "walletDetails",
    "SETTINGS": "settings",
    "FAQ": "faq",
    "ONBOARDING": "onboarding",
    "PAYWALL": "paywall",
    "SECURITY_CONFIG": "securityConfig"
}

export const SECURITY_OPTIONS = {
    "ICLOUD": "iCloud",
    "SENTINEL": "sentinel",
    "E_STORAGE": "encryptedStorage"
}

export const KEYCHAIN_KEY = {
    "WALLETS": "wallets",
}
export const SENTINEL_CLOUD_KEY = {
    "WALLETS": "wallets"
}
export const E_STORAGE_KEY = {
    "WALLETS": "com.sentinel.cryptowarden.wallets"
}

export const LOCAL_STORAGE_KEYS = {
    "PASSWORD": Platform.OS === 'android' ? "com.sentinel.cryptowarden.password" : "password",
    "SECURITY_OPTION": Platform.OS === 'android' ? "com.sentinel.cryptowarden.securityOption" : "securityOption",
    "DARK_MODE": Platform.OS === 'android' ? "com.sentinel.cryptowarden.darkMode" : "darkMode"
}

export const COLLECTION = {
    "DATA": "data"
}

export const DEFAULT_PADDING = 24
export const DEFAULT_05x_MARGIN = 4
export const DEFAULT_1x_MARGIN = 8
export const DEFAULT_2x_MARGIN = 16
export const DEFAULT_3x_MARGIN = 24
export const DEFAULT_15_MARGIN = 12
export const DEFAULT_CORNER_RADIUS = 9
export const TOP_NAV_TITLE_SIZE = 27
export const TOP_NAV_TITLE_WEIGHT = '800'
export const HANDSET = 'Handset'
export const BUTTON_FONT_SIZE = 18
export const DEFAULT_TEXT_SIZE = 17
export const DEFAULT_MODAL_TITLE = 20
export const TAB_ICON_SIZE = 28
export const TOAST_POSITION = 'bottom'

export const WALLET_PROVIDERS = [
    {
        "id": -1,
        "name": "Crypto Wallet",
        "imagePath": APP_ICON_IMAGE
    }, {
        "id": 0,
        "name": "Metamask",
        "imagePath": METAMASK_IMAGE
    },
    {
        "id": 1,
        "name": "Phantom",
        "imagePath": PHANTOM_IMAGE
    },
    {
        "id": 2,
        "name": "Crypto.com Defi",
        "imagePath": CRYPTOCOMDEFI_IMAGE
    },
    {
        "id": 3,
        "name": "Keplr",
        "imagePath": KEPLR_IMAGE
    },
    {
        "id": 4,
        "name": "Terrastation",
        "imagePath": TERRASTATION_IMAGE
    },
    {
        "id": 5,
        "name": "TrustWallet",
        "imagePath": TRUSTWALLET_IMAGE
    },
    {
        "id": 6,
        "name": "Sui",
        "imagePath": SUI_IMAGE
    },
    {
        "id": 7,
        "name": "Exodus",
        "imagePath": EXODUS_IMAGE
    },
    {
        "id": 8,
        "name": "MyEtherWallet",
        "imagePath": MYETHERWALLET_IMAGE
    },
    {
        "id": 9,
        "name": "Coinomi",
        "imagePath": COINOMI_IMAGE
    },
    {
        "id": 10,
        "name": "Petra",
        "imagePath": PETRA_IMAGE
    },
    {
        "id": 11,
        "name": "Coinbase Wallet",
        "imagePath": COINBASEWALLET_IMAGE
    },
    {
        "id": 12,
        "name": "Ledger",
        "imagePath": LEDGER_IMAGE
    },
    {
        "id": 13,
        "name": "KeepKey",
        "imagePath": KEEPKEY_IMAGE
    },
    {
        "id": 14,
        "name": "Trezor",
        "imagePath": TREZOR_IMAGE
    },
    {
        "id": 15,
        "name": "Airgap",
        "imagePath": AIRGAP_IMAGE
    },
    {
        "id": 16,
        "name": "Atomic",
        "imagePath": ATOMIC_IMAGE
    },
    {
        "id": 17,
        "name": "Xdefi",
        "imagePath": XDEFI_IMAGE
    },
    {
        "id": 18,
        "name": "Blue",
        "imagePath": BLUE_IMAGE
    }
]


interface SeedStatusMessage {
    [key: number]: {
        message: string;
        color: string;
    };
}

export const SEED_STATUS_MESSAGE: SeedStatusMessage = {
    0: {
        message: 'No seed has been provided yet',
        color: 'rgb(212, 182, 74)'
    },
    1: {
        message: 'Seed should be composed of 12 words',
        color: 'rgb(222, 77, 67)'
    },
    2: {
        message: 'Seed starts or ends with a space',
        color: 'rgb(222, 77, 67)'
    },
    3: {
        message: 'Seed contains special characters',
        color: 'rgb(222, 77, 67)'
    },
    4: {
        message: 'Seed looks fine 😉',
        color: 'rgb(94, 179, 79)'
    }
}