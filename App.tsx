/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */


import React, { useEffect } from 'react';

import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import Home from './src/pages/Home';
import Add from './src/pages/AddWallet';
import Settings from './src/pages/Settings';
import { NavigationContainer } from '@react-navigation/native';
import { useTheme } from "@ui-kitten/components";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PAGES, TAB_ICON_SIZE } from './src/utils/constants';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit'
import walletSlice from './src/redux/WalletSlice'
import accountSlice from './src/redux/AccountSlice'
import { default as light } from './src/themes/light.json';
import { default as dark } from './src/themes/dark.json';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import WalletDetails from './src/pages/WalletDetails';
import OnboardingCarousel from './src/pages/OnboardingCarousel';
import Paywall from './src/pages/Paywall';
import Toast, { BaseToast } from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Navigator from './src/Navigator';

const store = configureStore({
  reducer: {
    walletSlice: walletSlice,
    accountSlice: accountSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

const App = () => {

  const Stack = createNativeStackNavigator();

  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <Provider store={store}>
        <SafeAreaProvider>
          <ApplicationProvider {...eva}
            theme={useColorScheme() === 'dark' ? { ...dark } : { ...light }}>
            <Navigator />
          </ApplicationProvider>
        </SafeAreaProvider>
      </Provider>
    </>
  );
};

export default App;

