import { createSlice } from '@reduxjs/toolkit'
import { Platform } from 'react-native'
import { SECURITY_OPTIONS } from '../utils/constants'

const accountSlice = createSlice({
    name: 'wallets',
    initialState: {
        premium: false,
        authenticated: false,
        uid: undefined,
        sentinelPremium: false,
        securityOption: undefined as string | undefined,
        password: undefined,
        darkMode: false
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
            var securityOption = action.payload
            if (!securityOption) {
                securityOption = Platform.OS === 'android' ? SECURITY_OPTIONS.E_STORAGE : SECURITY_OPTIONS.ICLOUD
            }
            state.securityOption = securityOption
        },
        setPassword: (state, action) => {
            state.password = action.payload
        },
        setDarkMode: (state, action) => {
            state.darkMode = action.payload
        }
    }
})

export const { setPremium, setAuthenticated, setUID, setSentinelPremium, setSecurityOption, setPassword, setDarkMode } = accountSlice.actions
export default accountSlice.reducer