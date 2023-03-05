import { createSlice } from '@reduxjs/toolkit'
import Wallet from '../class/Wallet'
import { setWalletsToKeychain } from '../storage/KeychainManager'

const walletSlice = createSlice({
    name: 'wallets',
    initialState: {
        wallets: [] as Wallet[],
        newWallet: undefined as Wallet | undefined,
        selectedWallet: undefined as Wallet | undefined
    },
    reducers: {
        addNewWallet: (state, action) => {
            var walletList: Wallet[] = state.wallets
            let newWallet: Wallet[] = [action.payload.newWallet]
            walletList = walletList.concat(newWallet)
            state.wallets = walletList
            setWalletsToKeychain(walletList, action.payload.synchronizable)
        },
        loadWallets: (state, action) => {
            state.wallets = action.payload
        },
        setSelectedWallet: (state, action) => {
            state.selectedWallet = action.payload
        },
        updateWallet: (state, action) => {
            var walletList: Wallet[] = state.wallets
            let updatedWallet: Wallet = action.payload.updatedWallet

            // Find the index of object from array that you want to update
            const wIndex = walletList.findIndex(w => w.id === updatedWallet.id);

            // Make sure to avoid incorrect replacement
            // When specific item is not found
            if (wIndex === -1) {
                return;
            }

            // Make final new array of objects by combining updated object.
            const updatedWallets = [
                ...walletList.slice(0, wIndex),
                updatedWallet,
                ...walletList.slice(wIndex + 1),
            ];

            state.wallets = updatedWallets
            setWalletsToKeychain(updatedWallets, action.payload.synchronizable)
        }
    }
})

export const { addNewWallet, loadWallets, setSelectedWallet, updateWallet } = walletSlice.actions
export default walletSlice.reducer