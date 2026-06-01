import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WalletData } from '../types/wallet.types';
import { setWalletsToKeychain } from '../storage/KeychainManager';

interface WalletState {
  wallets: WalletData[];
  selectedWallet: WalletData | undefined;
  /** Wallet received via cryptowarden:// URL — awaiting user confirmation before saving. */
  pendingURLWallet: WalletData | undefined;
}

const walletSlice = createSlice({
  name: 'wallets',
  initialState: {
    wallets: [] as WalletData[],
    selectedWallet: undefined as WalletData | undefined,
    pendingURLWallet: undefined as WalletData | undefined,
  } satisfies WalletState,
  reducers: {
    addNewWallet: (
      state,
      action: PayloadAction<{ newWallet: WalletData; synchronizable: boolean }>,
    ) => {
      const updated = [...state.wallets, action.payload.newWallet];
      state.wallets = updated;
      // Side effect in reducer — intentional; kept for simplicity over async thunk
      setWalletsToKeychain(updated, action.payload.synchronizable);
    },

    loadWallets: (state, action: PayloadAction<WalletData[]>) => {
      state.wallets = action.payload;
    },

    setSelectedWallet: (state, action: PayloadAction<WalletData | undefined>) => {
      state.selectedWallet = action.payload;
    },

    updateWallet: (
      state,
      action: PayloadAction<{ updatedWallet: WalletData; synchronizable: boolean }>,
    ) => {
      const { updatedWallet, synchronizable } = action.payload;
      // Match by id — safe even when the seed phrase itself is edited
      const idx = state.wallets.findIndex((w: WalletData) => w.id === updatedWallet.id);
      if (idx === -1) return;

      const updated = [
        ...state.wallets.slice(0, idx),
        updatedWallet,
        ...state.wallets.slice(idx + 1),
      ];
      state.wallets = updated;
      // Side effect in reducer — intentional; kept for simplicity over async thunk
      setWalletsToKeychain(updated, synchronizable);
    },

    setPendingURLWallet: (state, action: PayloadAction<WalletData | undefined>) => {
      state.pendingURLWallet = action.payload;
    },
  },
});

export const {
  addNewWallet,
  loadWallets,
  setSelectedWallet,
  updateWallet,
  setPendingURLWallet,
} = walletSlice.actions;

export default walletSlice.reducer;
