import { createSlice } from '@reduxjs/toolkit'
import { Platform } from 'react-native'
import { SECURITY_OPTIONS } from '../utils/constants'

const accountSlice = createSlice({
    name: 'accounts',
    initialState: {
        premium: false,
        authenticated: false,
        uid: undefined,
        sentinelPremium: false,
        // Chosen storage backend (see SECURITY_OPTIONS). `undefined` until loaded
        // from local storage / defaulted on first launch.
        securityOption: undefined as string | undefined,
        // Encryption password for the encrypted backends (Sentinel Cloud / Encrypted
        // Storage). Kept only on-device; never leaves it.
        password: undefined as string | undefined,
    },
    reducers: {
        setPremium: (state, action) => {
            state.premium = action.payload
        },
        setAuthenticated: (state, action) => {
            state.authenticated = action.payload
        },
        setUID: (state, action) => {
            state.uid = action.payload
        },
        setSentinelPremium: (state, action) => {
            state.sentinelPremium = action.payload
        },
        setSecurityOption: (state, action) => {
            // Default to the platform-appropriate local backend when unset.
            state.securityOption =
                action.payload ??
                (Platform.OS === 'android'
                    ? SECURITY_OPTIONS.E_STORAGE
                    : SECURITY_OPTIONS.ICLOUD)
        },
        setPassword: (state, action) => {
            state.password = action.payload
        },
    }
})

export const {
    setPremium,
    setAuthenticated,
    setUID,
    setSentinelPremium,
    setSecurityOption,
    setPassword,
} = accountSlice.actions
export default accountSlice.reducer
