import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WalletData } from '../types/wallet.types';
import { saveWallets } from '../storage/StorageManager';

interface WalletState {
  wallets: WalletData[];
  selectedWallet: WalletData | undefined;
  /** Wallet received via cryptowarden:// URL — awaiting user confirmation before saving. */
  pendingURLWallet: WalletData | undefined;
}

/** Storage context threaded through write actions so saves hit the chosen backend. */
interface StorageContext {
  securityOption: string;
  uid?: string;
  password?: string;
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
      action: PayloadAction<{ newWallet: WalletData } & StorageContext>,
    ) => {
      const { newWallet, securityOption, uid, password } = action.payload;
      const updated = [...state.wallets, newWallet];
      state.wallets = updated;
      // Side effect in reducer — intentional; kept for simplicity over async thunk.
      // Persists to whichever backend the user selected in Security Config.
      saveWallets({ local: updated, securityOption, uid, password });
    },

    loadWallets: (state, action: PayloadAction<WalletData[]>) => {
      state.wallets = action.payload;
    },

    setSelectedWallet: (state, action: PayloadAction<WalletData | undefined>) => {
      state.selectedWallet = action.payload;
    },

    updateWallet: (
      state,
      action: PayloadAction<{ updatedWallet: WalletData } & StorageContext>,
    ) => {
      const { updatedWallet, securityOption, uid, password } = action.payload;
      // Match by id — safe even when the seed phrase itself is edited
      const idx = state.wallets.findIndex((w: WalletData) => w.id === updatedWallet.id);
      if (idx === -1) return;

      const updated = [
        ...state.wallets.slice(0, idx),
        updatedWallet,
        ...state.wallets.slice(idx + 1),
      ];
      state.wallets = updated;
      // Side effect in reducer — intentional; kept for simplicity over async thunk.
      // Persists to whichever backend the user selected in Security Config.
      saveWallets({ local: updated, securityOption, uid, password });
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
