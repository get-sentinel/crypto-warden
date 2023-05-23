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

import Home from './pages/Home';
import Add from './pages/AddWallet';
import Settings from './pages/Settings';
import { NavigationContainer } from '@react-navigation/native';
import { ApplicationProvider, useTheme } from "@ui-kitten/components";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PAGES, TAB_ICON_SIZE } from './utils/constants';
import { configureStore } from '@reduxjs/toolkit'
import walletSlice from './redux/WalletSlice'
import accountSlice from './redux/AccountSlice'
import WalletDetails from './pages/WalletDetails';
import OnboardingCarousel from './pages/OnboardingCarousel';
import Paywall from './pages/Paywall';
import Toast from 'react-native-toast-message';
import { getToastConfig } from './config/ToastConfig';
import { createStackNavigator } from '@react-navigation/stack';
import SecurityConfig from './pages/SecurityConfig';

const Navigator = () => {

    const Stack = createStackNavigator();
    const theme = useTheme()

    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen
                    name={PAGES.HOME}
                    component={Home}
                    options={{ headerShown: false }} />
                <Stack.Screen
                    key={PAGES.ADD}
                    name={PAGES.ADD}
                    component={Add}
                    options={{ headerShown: false, presentation: 'modal' }}
                />
                <Stack.Screen
                    key={PAGES.SETTINGS}
                    name={PAGES.SETTINGS}
                    component={Settings}
                    options={{ headerShown: false, presentation: 'modal' }}
                />
                <Stack.Screen
                    key={PAGES.WALLET_DETAILS}
                    name={PAGES.WALLET_DETAILS}
                    component={WalletDetails}
                    options={{ headerShown: false, presentation: 'modal' }}
                />
                <Stack.Screen
                    key={PAGES.ONBOARDING}
                    name={PAGES.ONBOARDING}
                    component={OnboardingCarousel}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    key={PAGES.PAYWALL}
                    name={PAGES.PAYWALL}
                    component={Paywall}
                    options={{ headerShown: false, presentation: 'modal' }}
                />
                <Stack.Screen
                    key={PAGES.SECURITY_CONFIG}
                    name={PAGES.SECURITY_CONFIG}
                    component={SecurityConfig}
                    options={{ headerShown: false, presentation: 'modal' }}
                />
            </Stack.Navigator>
            <Toast config={getToastConfig(theme)} />
        </NavigationContainer>
    );
};

export default Navigator;

