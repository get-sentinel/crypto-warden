import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Card, Divider, Icon, Text, TopNavigation, useTheme } from '@ui-kitten/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import RNModal from 'react-native-modal';
import DeviceInfo from 'react-native-device-info';
import * as Keychain from 'react-native-keychain';

import PageTitle from '../components/PageTitle';
import SettingsCell from '../components/cells/SettingsCell';
import ExportModal from '../components/modals/ExportModal';
import {
  APP_STORE_IOS_ID,
  BUTTON_FONT_SIZE,
  DEFAULT_2x_MARGIN,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_MODAL_TITLE,
  DEFAULT_PADDING,
  DEFAULT_TEXT_SIZE,
  PAGES,
  TOAST_POSITION,
} from '../utils/constants';
import { INACTIVITY_OPTIONS, AppSettings, ThemeMode } from '../types/settings.types';
import { openURL } from '../utils/utils';
import { saveSettingsAsync } from '../redux/SettingsSlice';
import {
  deleteAccount,
  signInWithAppleCredentials,
  signInWithGoogle,
  signInWithEmail,
  createAccountWithEmail,
  signOut,
} from '../firebase/firebaseAuth';
import { storeBiometricSentinel, removeBiometricSentinel } from '../storage/KeychainManager';
const { restorePurchases } = require('../iap/PurchaseIAP');

import AUTHENTICATOR_ICON from '../assets/authenticator.jpg';
import PREMIUM_BACKGROUND from '../assets/premium-background.png';

type EmailAuthMode = 'signin' | 'signup';

const Settings = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const premium: boolean = useSelector((state: any) => state.accountSlice.premium);
  const uid: string = useSelector((state: any) => state.accountSlice.uid);
  const authenticated: boolean = useSelector((state: any) => state.accountSlice.authenticated);
  const biometricEnabled: boolean = useSelector((state: any) => state.settingsSlice.biometricEnabled);
  const inactivityTimeoutSeconds: number = useSelector((state: any) => state.settingsSlice.inactivityTimeoutSeconds);
  const themeMode: ThemeMode = useSelector((state: any) => state.settingsSlice.themeMode ?? 'system');

  const [signinModalVisible, setSigninModalVisible] = useState(false);
  const [deletionModalVisible, setDeletionModalVisible] = useState(false);
  const [timeoutPickerVisible, setTimeoutPickerVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [emailAuthVisible, setEmailAuthVisible] = useState(false);
  const [emailAuthMode, setEmailAuthMode] = useState<EmailAuthMode>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const currentSettings = (): AppSettings => ({ biometricEnabled, inactivityTimeoutSeconds, themeMode });

  const rateApp = () => {
    Linking.openURL(
      `itms-apps://itunes.apple.com/app/id${APP_STORE_IOS_ID}?action=write-review`,
    ).catch(() => {
      Linking.openURL(
        `https://apps.apple.com/app/id${APP_STORE_IOS_ID}?action=write-review`,
      );
    });
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const biometryType = await Keychain.getSupportedBiometryType();
      if (!biometryType) {
        Toast.show({
          type: 'error',
          position: TOAST_POSITION,
          text1: 'Not available',
          text2: 'Biometric authentication is not set up on this device',
          visibilityTime: 3000,
          props: { iconName: 'alert' },
        });
        return;
      }
      const stored = await storeBiometricSentinel();
      if (!stored) {
        Toast.show({
          type: 'error',
          position: TOAST_POSITION,
          text1: 'Setup failed',
          text2: 'Could not enable biometric lock — try again',
          visibilityTime: 3000,
          props: { iconName: 'alert' },
        });
        return;
      }
    } else {
      await removeBiometricSentinel();
    }
    dispatch(saveSettingsAsync({ ...currentSettings(), biometricEnabled: value }) as any);
  };

  const handleDarkModeToggle = (value: boolean) => {
    const newMode: ThemeMode = value ? 'dark' : 'light';
    dispatch(saveSettingsAsync({ ...currentSettings(), themeMode: newMode }) as any);
  };

  const handleTimeoutSelect = (value: number) => {
    dispatch(saveSettingsAsync({ ...currentSettings(), inactivityTimeoutSeconds: value }) as any);
    setTimeoutPickerVisible(false);
  };

  const purchasePremium = () => {
    if (!premium) {
      navigation.navigate(PAGES.PAYWALL);
    } else {
      Toast.show({
        type: 'success',
        position: TOAST_POSITION,
        text1: 'Already Activated 🎉',
        text2: 'Thanks for your support',
        visibilityTime: 2000,
        props: { iconName: 'crown' },
      });
    }
  };

  const handleEmailAuth = async () => {
    if (!emailInput.trim() || !passwordInput.trim()) {
      Toast.show({ type: 'error', position: TOAST_POSITION, text1: 'Fill in all fields', visibilityTime: 2000, props: { iconName: 'alert' } });
      return;
    }
    setEmailLoading(true);
    try {
      if (emailAuthMode === 'signin') {
        await signInWithEmail(emailInput.trim(), passwordInput);
      } else {
        await createAccountWithEmail(emailInput.trim(), passwordInput);
      }
      setEmailAuthVisible(false);
      setSigninModalVisible(false);
      setEmailInput('');
      setPasswordInput('');
    } catch (e: any) {
      Toast.show({
        type: 'error',
        position: TOAST_POSITION,
        text1: emailAuthMode === 'signin' ? 'Sign in failed' : 'Sign up failed',
        text2: e?.message ?? 'Please check your credentials',
        visibilityTime: 3000,
        props: { iconName: 'alert' },
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && false);
  const currentTimeoutLabel =
    INACTIVITY_OPTIONS.find(o => o.value === inactivityTimeoutSeconds)?.label ?? '2 minutes';

  return (
    <View style={[styles.root, { backgroundColor: theme['color-basic-500'] }]}>
      <TopNavigation
        style={[styles.topNav, { backgroundColor: theme['color-basic-500'] }]}
        title={(props: any) => <PageTitle title="Settings" props={props} />}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Premium upsell banner */}
        {!premium && (
          <TouchableOpacity
            onPress={purchasePremium}
            style={[styles.settingsBox, { backgroundColor: theme['color-basic-600'] }]}
          >
            <ImageBackground
              source={PREMIUM_BACKGROUND}
              imageStyle={{ borderRadius: DEFAULT_CORNER_RADIUS }}
              style={styles.premiumBanner}
            >
              <Text style={styles.premiumTitle}> Crypto Warden </Text>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}> Plus </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}

        {/* Appearance section */}
        <Text style={[styles.sectionHeader, { color: theme['text-hint-color'] }]}>APPEARANCE</Text>
        <View style={[styles.settingsBox, { backgroundColor: theme['color-basic-600'] }]}>
          <View style={styles.settingsItem}>
            <View style={styles.settingsTextAndIcon}>
              <View style={[styles.iconBox, { backgroundColor: '#1A1A2E' }]}>
                <MaterialCommunityIcons name="moon-waning-crescent" size={16} color="#fff" />
              </View>
              <Text style={[styles.settingsText, { color: theme['text-basic-color'] }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={handleDarkModeToggle}
              trackColor={{ true: theme['color-primary-500'] }}
            />
          </View>
        </View>

        {/* Security section */}
        <Text style={[styles.sectionHeader, { color: theme['text-hint-color'] }]}>SECURITY</Text>
        <View style={[styles.settingsBox, { backgroundColor: theme['color-basic-600'] }]}>
          <View style={styles.settingsItem}>
            <View style={styles.settingsTextAndIcon}>
              <View style={[styles.iconBox, { backgroundColor: '#4F8EF7' }]}>
                <MaterialCommunityIcons name="face-recognition" size={16} color="#fff" />
              </View>
              <Text style={[styles.settingsText, { color: theme['text-basic-color'] }]}>
                Biometric Lock
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ true: theme['color-primary-500'] }}
            />
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme['card-border-color'] }]} />

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => setTimeoutPickerVisible(true)}
          >
            <View style={styles.settingsTextAndIcon}>
              <View style={[styles.iconBox, { backgroundColor: '#7C3AED' }]}>
                <MaterialCommunityIcons name="timer-outline" size={16} color="#fff" />
              </View>
              <Text style={[styles.settingsText, { color: theme['text-basic-color'] }]}>
                Lock after
              </Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={[styles.valueText, { color: theme['text-hint-color'] }]}>
                {currentTimeoutLabel}
              </Text>
              <Icon name="arrow-ios-forward" fill={theme['text-hint-color']} style={styles.chevronIcon} />
            </View>
          </TouchableOpacity>

          <Divider style={[styles.divider, { backgroundColor: theme['card-border-color'] }]} />

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => {
              if (premium) {
                setExportModalVisible(true);
              } else {
                navigation.navigate(PAGES.PAYWALL);
              }
            }}
          >
            <View style={styles.settingsTextAndIcon}>
              <View style={[styles.iconBox, { backgroundColor: '#16A34A' }]}>
                <MaterialCommunityIcons name="export" size={16} color="#fff" />
              </View>
              <Text style={[styles.settingsText, { color: theme['text-basic-color'] }]}>
                Export Wallets
              </Text>
            </View>
            <View style={styles.valueRow}>
              {!premium && (
                <View style={[styles.plusBadge, { backgroundColor: theme['color-primary-500'] }]}>
                  <Text style={styles.plusBadgeText}>Plus</Text>
                </View>
              )}
              <Icon name="arrow-ios-forward" fill={theme['text-hint-color']} style={styles.chevronIcon} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Rate the app */}
        <View style={[styles.settingsBox, { backgroundColor: theme['color-basic-600'] }]}>
          <TouchableOpacity style={styles.settingsItem} onPress={rateApp}>
            <View style={styles.settingsTextAndIcon}>
              <View style={[styles.iconBox, { backgroundColor: 'rgb(249,222,82)' }]}>
                <MaterialCommunityIcons name="star" size={16} color="#fff" />
              </View>
              <Text style={[styles.settingsText, { color: theme['text-basic-color'] }]}>
                Love this app? Rate it 😊
              </Text>
            </View>
            <Icon name="diagonal-arrow-right-up-outline" fill={theme['text-hint-color']} style={styles.chevronIcon} />
          </TouchableOpacity>
        </View>

        {/* Account section */}
        <View style={[styles.settingsBox, { backgroundColor: theme['color-basic-600'] }]}>
          <View style={styles.settingsItem}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => setSigninModalVisible(true)}
            >
              <View style={styles.settingsTextAndIcon}>
                <View style={[styles.iconBox, { backgroundColor: 'rgb(53,120,246)' }]}>
                  <MaterialIcons name="person" size={16} color="#fff" />
                </View>
                <Text style={[styles.settingsText, { color: theme['text-basic-color'] }]}>
                  Sign In
                </Text>
              </View>
              <Icon name="info-outline" fill={theme['text-hint-color']} style={{ width: 20, height: 20, marginLeft: 5 }} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => (authenticated ? signOut() : setSigninModalVisible(true))}
            >
              <Text style={[styles.actionText, { color: theme['color-primary-500'] }]}>
                {authenticated ? 'Log Out' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <Divider style={[styles.divider, { backgroundColor: theme['card-border-color'] }]} />

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => {
              if (uid) {
                Clipboard.setString(uid);
                Toast.show({
                  type: 'success',
                  position: TOAST_POSITION,
                  text1: 'User ID copied',
                  text2: 'Share it with support if asked',
                  visibilityTime: 2000,
                  props: { iconName: 'face-agent' },
                });
              } else {
                setSigninModalVisible(true);
              }
            }}
          >
            <View style={styles.settingsTextAndIcon}>
              <View style={[styles.iconBox, { backgroundColor: 'rgb(89,168,214)' }]}>
                <MaterialCommunityIcons name="badge-account" size={16} color="#fff" />
              </View>
              <Text style={[styles.settingsText, { color: theme['text-basic-color'] }]}>
                User ID
              </Text>
            </View>
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              style={[styles.uidText, { color: theme['text-hint-color'] }]}
            >
              {uid ?? 'N/A'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* About section */}
        <View style={[styles.settingsBox, { backgroundColor: theme['color-basic-600'] }]}>
          <SettingsCell
            headingIcon="information-variant"
            trailingIcon="arrow-ios-forward"
            text="How it works"
            iconBackgroundColor="rgb(230, 71, 116)"
            onPress={() => navigation.navigate(PAGES.ONBOARDING)}
          />
          <Divider style={[styles.divider, { backgroundColor: theme['card-border-color'] }]} />
          <SettingsCell
            headingIcon="github"
            trailingIcon="diagonal-arrow-right-up-outline"
            text="Open Source Repository"
            iconBackgroundColor="rgb(0,0,0)"
            onPress={() => openURL('https://github.com/get-sentinel/crypto-warden')}
          />
          <Divider style={[styles.divider, { backgroundColor: theme['card-border-color'] }]} />
          <SettingsCell
            headingIcon="security"
            trailingIcon="diagonal-arrow-right-up-outline"
            text="Security Model"
            iconBackgroundColor="rgb(84, 190, 255)"
            onPress={() => openURL('https://getsentinel.io/security-model?ref=app')}
          />
        </View>

        {/* Authenticator cross-promo */}
        <View style={[styles.settingsBox, { backgroundColor: theme['color-basic-600'] }]}>
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() =>
              openURL('https://apps.apple.com/it/app/sentinel-authenticator-2fa/id1189922806')
            }
          >
            <View style={styles.settingsTextAndIcon}>
              <View style={styles.appIconWrapper}>
                <Image source={AUTHENTICATOR_ICON} style={styles.appIcon} />
              </View>
              <Text style={[styles.settingsText, { color: theme['text-basic-color'] }]}>
                Try our 2FA Authenticator app
              </Text>
            </View>
            <Icon name="diagonal-arrow-right-up-outline" fill={theme['text-hint-color']} style={styles.chevronIcon} />
          </TouchableOpacity>
        </View>

        {/* Support section */}
        <View style={[styles.settingsBox, { backgroundColor: theme['color-basic-600'] }]}>
          <SettingsCell
            headingIcon="restore"
            trailingIcon="arrow-ios-forward"
            text="Restore Purchase"
            iconBackgroundColor="rgb(53,120,246)"
            onPress={() => restorePurchases(dispatch)}
          />
          <Divider style={[styles.divider, { backgroundColor: theme['card-border-color'] }]} />
          <SettingsCell
            headingIcon="email"
            trailingIcon="diagonal-arrow-right-up-outline"
            text="Email"
            iconBackgroundColor="rgb(241,155,55)"
            onPress={() => openURL('mailto:hello@getsentinel.io')}
          />
          <Divider style={[styles.divider, { backgroundColor: theme['card-border-color'] }]} />
          <SettingsCell
            headingIcon="twitter"
            trailingIcon="diagonal-arrow-right-up-outline"
            text="Twitter"
            iconBackgroundColor="rgb(89,168,214)"
            onPress={() => openURL('https://twitter.com/sentinel2FA')}
          />
          <Divider style={[styles.divider, { backgroundColor: theme['card-border-color'] }]} />
          <SettingsCell
            headingIcon="frequently-asked-questions"
            trailingIcon="diagonal-arrow-right-up-outline"
            text="FAQ"
            iconBackgroundColor="rgb(163,86,215)"
            onPress={() => openURL('https://getsentinel.io/crypto-warden#faq')}
          />
        </View>

        {/* Legal & app info */}
        <View style={[styles.settingsBox, { backgroundColor: theme['color-basic-600'] }]}>
          <View style={styles.settingsItem}>
            <View style={styles.settingsTextAndIcon}>
              <View style={[styles.iconBox, { backgroundColor: 'rgb(0,0,0)' }]}>
                <MaterialIcons name="code" size={16} color="#fff" />
              </View>
              <Text style={[styles.settingsText, { color: theme['text-basic-color'] }]}>
                Version
              </Text>
            </View>
            <Text style={[styles.actionText, { color: theme['text-hint-color'] }]}>
              {DeviceInfo.getVersion()}
            </Text>
          </View>
          <Divider style={[styles.divider, { backgroundColor: theme['card-border-color'] }]} />
          <SettingsCell
            headingIcon="application-outline"
            trailingIcon="diagonal-arrow-right-up-outline"
            text="Website"
            iconBackgroundColor="rgb(101,195,102)"
            onPress={() => openURL('https://getsentinel.io/crypto-warden')}
          />
          <Divider style={[styles.divider, { backgroundColor: theme['card-border-color'] }]} />
          <SettingsCell
            headingIcon="shield-search"
            trailingIcon="diagonal-arrow-right-up-outline"
            text="Privacy Policy"
            iconBackgroundColor="rgb(53,120,246)"
            onPress={() => openURL('https://getsentinel.io/privacy-policy?ref=app')}
          />
          <Divider style={[styles.divider, { backgroundColor: theme['card-border-color'] }]} />
          <SettingsCell
            headingIcon="copyright"
            trailingIcon="diagonal-arrow-right-up-outline"
            text="Copyright"
            iconBackgroundColor="rgb(170,170,170)"
            onPress={() => openURL('https://getsentinel.io/terms-of-service?ref=app')}
          />
        </View>

        {/* Delete account */}
        <View style={[styles.settingsBox, { backgroundColor: theme['color-basic-600'] }]}>
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => {
              if (authenticated) {
                setDeletionModalVisible(true);
              } else {
                Toast.show({
                  type: 'error',
                  position: TOAST_POSITION,
                  text1: 'Sign in first',
                  text2: 'You need to sign in before deleting your account',
                  visibilityTime: 2000,
                  props: { iconName: 'alert' },
                });
              }
            }}
          >
            <View style={styles.settingsTextAndIcon}>
              <View style={[styles.iconBox, { backgroundColor: 'rgb(235,78,61)' }]}>
                <MaterialCommunityIcons name="account-remove" size={16} color="#fff" />
              </View>
              <Text style={[styles.settingsText, { color: theme['text-basic-color'] }]}>
                Delete Account
              </Text>
            </View>
            <Icon name="arrow-ios-forward" fill={theme['text-hint-color']} style={styles.chevronIcon} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Modals ── */}

      {/* Inactivity timeout picker */}
      <RNModal
        isVisible={timeoutPickerVisible}
        onBackdropPress={() => setTimeoutPickerVisible(false)}
        onSwipeComplete={() => setTimeoutPickerVisible(false)}
        swipeDirection="down"
        style={styles.modal}
      >
        <Card
          disabled
          style={[styles.modalCard, { backgroundColor: theme['color-basic-modal-background'] }]}
        >
          <Text style={[styles.modalTitle, { color: theme['text-basic-color'] }]}>
            Lock after inactivity
          </Text>
          {INACTIVITY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={styles.timeoutOption}
              onPress={() => handleTimeoutSelect(opt.value)}
            >
              <Text style={[styles.timeoutOptionText, { color: theme['text-basic-color'] }]}>
                {opt.label}
              </Text>
              {opt.value === inactivityTimeoutSeconds && (
                <MaterialCommunityIcons name="check" size={20} color={theme['color-primary-500']} />
              )}
            </TouchableOpacity>
          ))}
        </Card>
      </RNModal>

      {/* Sign in modal */}
      <RNModal
        isVisible={signinModalVisible}
        onBackdropPress={() => { setSigninModalVisible(false); setEmailAuthVisible(false); }}
        onSwipeComplete={() => { setSigninModalVisible(false); setEmailAuthVisible(false); }}
        swipeDirection="down"
        style={styles.modal}
      >
        <Card
          disabled
          style={[styles.modalCard, { backgroundColor: theme['color-basic-modal-background'] }]}
        >
          {!emailAuthVisible ? (
            <>
              <Text style={[styles.modalTitle, { color: theme['text-basic-color'], marginBottom: 8 }]}>
                Sign In
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme['text-hint-color'] }]}>
                Sync Premium across devices and stay informed about Sentinel updates.
              </Text>

              {/* Apple Sign In */}
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: theme['color-basic-900'] }]}
                onPress={() => {
                  setSigninModalVisible(false);
                  if (!authenticated) signInWithAppleCredentials();
                }}
              >
                <MaterialCommunityIcons name="apple" size={20} color="#fff" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>
                  {authenticated ? 'Connected with Apple' : 'Continue with Apple'}
                </Text>
              </TouchableOpacity>

              {/* Google Sign In */}
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: theme['color-basic-600'], borderWidth: 1, borderColor: theme['card-border-color'] }]}
                onPress={async () => {
                  try {
                    await signInWithGoogle();
                    setSigninModalVisible(false);
                  } catch (e: any) {
                    Toast.show({ type: 'error', position: TOAST_POSITION, text1: 'Google Sign-In failed', text2: e?.message ?? 'Try again', visibilityTime: 3000, props: { iconName: 'alert' } });
                  }
                }}
              >
                <MaterialCommunityIcons name="google" size={20} color="#EA4335" style={styles.socialIcon} />
                <Text style={[styles.socialButtonText, { color: theme['text-basic-color'] }]}>
                  Continue with Google
                </Text>
              </TouchableOpacity>

              {/* Email Sign In */}
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: theme['color-primary-500'] }]}
                onPress={() => { setEmailAuthMode('signin'); setEmailAuthVisible(true); }}
              >
                <MaterialCommunityIcons name="email-outline" size={20} color="#fff" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Continue with Email</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setSigninModalVisible(false)}>
                <Text style={[styles.cancelText, { color: theme['text-hint-color'] }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.backButton} onPress={() => setEmailAuthVisible(false)}>
                <MaterialCommunityIcons name="arrow-left" size={20} color={theme['text-hint-color']} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme['text-basic-color'], marginBottom: 20 }]}>
                {emailAuthMode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>

              <TextInput
                placeholder="Email"
                placeholderTextColor={theme['text-hint-color']}
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.emailInput, {
                  backgroundColor: theme['color-basic-500'],
                  color: theme['text-basic-color'],
                  borderColor: theme['card-border-color'],
                }]}
              />
              <TextInput
                placeholder="Password"
                placeholderTextColor={theme['text-hint-color']}
                value={passwordInput}
                onChangeText={setPasswordInput}
                secureTextEntry
                style={[styles.emailInput, {
                  backgroundColor: theme['color-basic-500'],
                  color: theme['text-basic-color'],
                  borderColor: theme['card-border-color'],
                }]}
              />

              <Button
                style={[styles.modalButton, { backgroundColor: theme['color-primary-500'], borderWidth: 0, borderRadius: DEFAULT_CORNER_RADIUS }]}
                onPress={handleEmailAuth}
                disabled={emailLoading}
              >
                {(props: any) => (
                  <Text {...props} style={{ color: '#fff', fontWeight: '600', fontSize: BUTTON_FONT_SIZE }}>
                    {emailLoading ? 'Please wait…' : emailAuthMode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </Button>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEmailAuthMode(emailAuthMode === 'signin' ? 'signup' : 'signin')}
              >
                <Text style={[styles.cancelText, { color: theme['color-primary-500'] }]}>
                  {emailAuthMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Card>
      </RNModal>

      {/* Delete account confirmation */}
      <RNModal
        isVisible={deletionModalVisible}
        onBackdropPress={() => setDeletionModalVisible(false)}
        onSwipeComplete={() => setDeletionModalVisible(false)}
        swipeDirection="down"
        style={styles.modal}
      >
        <Card
          disabled
          style={[styles.modalCard, { backgroundColor: theme['color-basic-modal-background'] }]}
        >
          <MaterialCommunityIcons
            style={styles.modalIcon}
            name="delete-variant"
            size={70}
            color={theme['text-basic-color']}
          />
          <Text style={[styles.modalTitle, { color: theme['text-basic-color'], marginBottom: 30 }]}>
            Are you sure you want to delete your account?
          </Text>
          <Button
            style={[styles.modalButton, { backgroundColor: 'rgb(235,78,61)', borderWidth: 0, borderRadius: DEFAULT_CORNER_RADIUS }]}
            onPress={() => {
              setDeletionModalVisible(false);
              deleteAccount();
            }}
          >
            {(props: any) => (
              <Text {...props} style={{ color: '#fff', fontWeight: '600', fontSize: BUTTON_FONT_SIZE }}>
                Delete
              </Text>
            )}
          </Button>
          <Button
            style={{ borderWidth: 0 }}
            appearance="ghost"
            onPress={() => setDeletionModalVisible(false)}
          >
            {(props: any) => (
              <Text {...props} style={{ color: theme['text-basic-color'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE }}>
                Cancel
              </Text>
            )}
          </Button>
        </Card>
      </RNModal>

      {exportModalVisible && (
        <ExportModal
          visible={exportModalVisible}
          onClose={() => setExportModalVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topNav: {
    paddingTop: 15,
    paddingHorizontal: DEFAULT_PADDING,
  },
  scrollContent: {
    paddingBottom: 50,
    paddingTop: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 6,
    marginTop: 4,
  },
  settingsBox: {
    borderRadius: DEFAULT_CORNER_RADIUS,
    marginBottom: 24,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  settingsItem: {
    width: '100%',
    height: 55,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 15,
  },
  settingsTextAndIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsText: {
    fontSize: 17,
  },
  iconBox: {
    marginRight: 10,
    borderRadius: 6,
    padding: 5,
  },
  divider: {
    width: '90%',
    alignSelf: 'flex-end',
  },
  chevronIcon: {
    width: 20,
    height: 20,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueText: {
    fontSize: 15,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '400',
  },
  uidText: {
    width: '50%',
    textAlign: 'right',
    fontSize: 14,
  },
  premiumBanner: {
    height: 55,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgb(34,52,45)',
  },
  premiumBadge: {
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: DEFAULT_CORNER_RADIUS,
  },
  premiumBadgeText: {
    fontSize: 19,
    fontWeight: '800',
    color: 'rgb(34,52,45)',
  },
  plusBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  plusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  appIconWrapper: {
    marginRight: 10,
  },
  appIcon: {
    width: 26,
    height: 26,
    borderRadius: 5,
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalCard: {
    borderColor: 'transparent',
    paddingHorizontal: DEFAULT_2x_MARGIN,
    paddingBottom: 0,
    width: '100%',
  },
  modalIcon: {
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: DEFAULT_MODAL_TITLE,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalBody: {
    textAlign: 'left',
    fontSize: DEFAULT_TEXT_SIZE,
    fontWeight: '400',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: DEFAULT_CORNER_RADIUS,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  socialIcon: {
    position: 'absolute',
    left: 16,
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 8,
  },
  cancelText: {
    fontSize: 15,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    padding: 4,
  },
  emailInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: DEFAULT_CORNER_RADIUS,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButton: {
    width: '100%',
    marginTop: 8,
  },
  timeoutOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  timeoutOptionText: {
    fontSize: 17,
  },
});

export default Settings;
