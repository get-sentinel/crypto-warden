import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, useColorScheme } from 'react-native';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EvaIconsPack } from '@ui-kitten/eva-icons';

import walletReducer from './src/redux/WalletSlice';
import accountReducer from './src/redux/AccountSlice';
import settingsReducer, { loadSettingsAsync, setLocked, updateLastActive } from './src/redux/SettingsSlice';
import { ThemeMode } from './src/types/settings.types';

import { default as light } from './src/themes/light.json';
import { default as dark } from './src/themes/dark.json';
import Navigator from './src/Navigator';

const store = configureStore({
  reducer: {
    walletSlice: walletReducer,
    accountSlice: accountReducer,
    settingsSlice: settingsReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

/** Watches AppState to trigger biometric re-lock after inactivity. */
function AppStateWatcher() {
  const dispatch = useDispatch();
  const biometricEnabled = useSelector((state: any) => state.settingsSlice.biometricEnabled);
  const inactivityTimeoutSeconds = useSelector((state: any) => state.settingsSlice.inactivityTimeoutSeconds);
  const lastActiveTimestamp = useSelector((state: any) => state.settingsSlice.lastActiveTimestamp);
  const backgroundedAt = useRef<number>(0);

  useEffect(() => {
    dispatch(loadSettingsAsync() as any);
  }, [dispatch]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
        dispatch(updateLastActive());
      } else if (nextState === 'active') {
        if (
          biometricEnabled &&
          inactivityTimeoutSeconds > 0 &&
          backgroundedAt.current > 0
        ) {
          const elapsed = (Date.now() - backgroundedAt.current) / 1000;
          if (elapsed >= inactivityTimeoutSeconds) {
            dispatch(setLocked(true));
          }
        }
        backgroundedAt.current = 0;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [dispatch, biometricEnabled, inactivityTimeoutSeconds, lastActiveTimestamp]);

  return null;
}

function AppThemed() {
  const colorScheme = useColorScheme();
  const themeMode: ThemeMode = useSelector((state: any) => state.settingsSlice.themeMode ?? 'system');
  const isDark = themeMode === 'system' ? colorScheme === 'dark' : themeMode === 'dark';

  return (
    <ApplicationProvider
      {...eva}
      theme={isDark ? { ...dark } : { ...light }}
    >
      <AppStateWatcher />
      <Navigator />
    </ApplicationProvider>
  );
}

const App = () => {
  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <Provider store={store}>
        <SafeAreaProvider>
          <AppThemed />
        </SafeAreaProvider>
      </Provider>
    </>
  );
};

export default App;
