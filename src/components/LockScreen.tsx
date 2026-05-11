import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Text, useTheme } from '@ui-kitten/components';
import { useDispatch } from 'react-redux';
import { setLocked } from '../redux/SettingsSlice';
import { authenticateWithBiometrics } from '../storage/KeychainManager';

const APP_ICON = require('../assets/app-icon.png');

export default function LockScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();

  const handleUnlock = useCallback(async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      dispatch(setLocked(false));
    }
  }, [dispatch]);

  // Auto-trigger biometric prompt as soon as lock screen appears
  useEffect(() => {
    handleUnlock();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme['lock-overlay-background'] },
      ]}
    >
      <Image source={APP_ICON} style={styles.icon} />
      <Text
        category="h4"
        style={[styles.title, { color: theme['text-basic-color'] }]}
      >
        CryptoWarden
      </Text>
      <Text
        category="s1"
        style={[styles.subtitle, { color: theme['text-hint-color'] }]}
      >
        Locked for your security
      </Text>
      <Button
        style={[styles.button, { borderRadius: 14 }]}
        size="large"
        onPress={handleUnlock}
      >
        Unlock with Face ID / Touch ID
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    zIndex: 999,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    fontWeight: '700',
  },
  subtitle: {
    marginBottom: 48,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});
