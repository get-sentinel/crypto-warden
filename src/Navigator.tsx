import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '@ui-kitten/components';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import { PAGES } from './utils/constants';
import { getToastConfig } from './config/ToastConfig';
import LockScreen from './components/LockScreen';

import Home from './pages/Home';
import AddWallet from './pages/AddWallet';
import Settings from './pages/Settings';
import WalletDetails from './pages/WalletDetails';
import OnboardingCarousel from './pages/OnboardingCarousel';
import Paywall from './pages/Paywall';
import SecurityConfig from './pages/SecurityConfig';

const Stack = createStackNavigator();
const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';

const Navigator = () => {
  const theme = useTheme();
  const isLocked = useSelector((state: any) => state.settingsSlice.isLocked);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY).then(val => {
      setInitialRoute(val ? PAGES.HOME : PAGES.ONBOARDING);
    });
  }, []);

  if (!initialRoute) return null;

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen
            name={PAGES.HOME}
            component={Home}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name={PAGES.ADD}
            component={AddWallet}
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name={PAGES.SETTINGS}
            component={Settings}
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name={PAGES.WALLET_DETAILS}
            component={WalletDetails}
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name={PAGES.ONBOARDING}
            component={OnboardingCarousel}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name={PAGES.PAYWALL}
            component={Paywall}
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name={PAGES.SECURITY_CONFIG}
            component={SecurityConfig}
            options={{ headerShown: false, presentation: 'modal' }}
          />
        </Stack.Navigator>
        <Toast config={getToastConfig(theme)} />
      </NavigationContainer>

      {isLocked && <LockScreen />}
    </>
  );
};

export default Navigator;
