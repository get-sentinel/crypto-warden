import { createSlice } from '@reduxjs/toolkit'

const accountSlice = createSlice({
    name: 'wallets',
    initialState: {
        premium: false,
        authenticated: false,
        uid: undefined,
        sentinelPremium: false
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
    }
})

export const { setPremium, setAuthenticated, setUID, setSentinelPremium } = accountSlice.actions
export default accountSlice.reducer