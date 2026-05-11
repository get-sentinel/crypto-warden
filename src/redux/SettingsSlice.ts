import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings.types';

const SETTINGS_KEY = '@cryptowarden_settings';

interface SettingsState extends AppSettings {
  /** Runtime-only — never persisted. True when the app requires biometric re-authentication. */
  isLocked: boolean;
  /** Epoch ms of last user interaction — runtime-only. */
  lastActiveTimestamp: number;
}

const initialState: SettingsState = {
  ...DEFAULT_SETTINGS,
  isLocked: false,
  lastActiveTimestamp: Date.now(),
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    applySettings: (state, action: PayloadAction<AppSettings>) => {
      state.biometricEnabled = action.payload.biometricEnabled;
      state.inactivityTimeoutSeconds = action.payload.inactivityTimeoutSeconds;
      state.themeMode = action.payload.themeMode ?? 'system';
    },

    setLocked: (state, action: PayloadAction<boolean>) => {
      state.isLocked = action.payload;
    },

    updateLastActive: state => {
      state.lastActiveTimestamp = Date.now();
    },
  },
});

export const { applySettings, setLocked, updateLastActive } = settingsSlice.actions;
export default settingsSlice.reducer;

// ── Thunks ────────────────────────────────────────────────────────────────────

/** Loads persisted settings from AsyncStorage and applies them to the store. */
export const loadSettingsAsync = () => async (dispatch: any) => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) dispatch(applySettings(JSON.parse(raw) as AppSettings));
  } catch {
    // Silently use defaults if storage is unavailable
  }
};

/** Persists settings to AsyncStorage and updates the store. */
export const saveSettingsAsync = (settings: AppSettings) => async (dispatch: any) => {
  dispatch(applySettings(settings));
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Persist failure is non-fatal — in-memory settings remain active
  }
};
