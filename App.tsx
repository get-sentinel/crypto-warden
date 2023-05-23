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
import { default as light } from './src/themes/light.json';
import { default as dark } from './src/themes/dark.json';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import Home from './src/pages/Home';
import Add from './src/pages/AddWallet';
import Settings from './src/pages/Settings';
import { NavigationContainer } from '@react-navigation/native';
import { useTheme } from "@ui-kitten/components";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PAGES, TAB_ICON_SIZE } from './src/utils/constants';
import { Provider, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit'
import walletSlice from './src/redux/WalletSlice'
import accountSlice from './src/redux/AccountSlice'
import { StatusBar, useColorScheme } from 'react-native';
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

  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <Provider store={store}>
        <SafeAreaProvider>
          <AppProvider />
        </SafeAreaProvider>
      </Provider>
    </>
  );
};

const AppProvider = () => {

  const darkMode = useSelector((state: any) => state.accountSlice.darkMode)

  return (
    <ApplicationProvider {...eva}
      theme={darkMode ? { ...dark } : { ...light }}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <Navigator />
    </ApplicationProvider >
  )
}

export default App;

