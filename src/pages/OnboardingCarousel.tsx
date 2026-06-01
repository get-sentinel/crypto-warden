import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import StableSafeArea from '../components/safeArea/StableSafeArea';
import RatingPromptModal from '../components/modals/RatingPromptModal';
import { PAGES, TOAST_POSITION } from '../utils/constants';
import {
  signInWithAppleCredentials,
  signInWithGoogle,
  signInWithEmail,
  createAccountWithEmail,
} from '../firebase/firebaseAuth';

import ONBOARDING1 from '../assets/onboarding/onboarding1.png';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';

type SlideType = 'info' | 'signin';

interface InfoSlide {
  type: 'info';
  image?: any;
  icon?: string;
  title: string;
  subtitle: string;
}
interface SignInSlide {
  type: 'signin';
}
type Slide = InfoSlide | SignInSlide;

const SLIDES: Slide[] = [
  {
    type: 'info',
    image: ONBOARDING1,
    title: 'Store your seed phrases',
    subtitle: 'Use any wallet provider to generate your wallet, then save the seed phrase in CryptoWarden.',
  },
  {
    type: 'info',
    icon: 'flash-outline',
    title: 'Copy in seconds',
    subtitle: 'Retrieve any saved seed phrase instantly — no digging through paper backups.',
  },
  {
    type: 'info',
    icon: 'shield-lock-outline',
    title: 'Encrypted on your device',
    subtitle: 'Your seed phrases are stored in your device’s secure keystore — never on our servers.',
  },
  {
    type: 'info',
    icon: 'backup-restore',
    title: 'Restore any time',
    subtitle: 'Need to recover a wallet? Open CryptoWarden, copy your seed phrase, and restore in seconds.',
  },
  { type: 'signin' },
];

export async function markOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}

export default function OnboardingCarousel() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Email auth state (used on last sign-in slide)
  const [emailMode, setEmailMode] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ratingVisible, setRatingVisible] = useState(false);

  const infoSlides = SLIDES.filter(s => s.type === 'info') as InfoSlide[];
  const isLastInfoSlide = activeIndex === infoSlides.length - 1;
  const isSignInSlide = activeIndex === SLIDES.length - 1;

  const primary = theme['color-primary-500'];

  const handleNext = () => {
    const next = activeIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  };

  const completeOnboarding = async () => {
    await markOnboardingComplete();
    setRatingVisible(true);
  };

  const handleRatingDismissed = () => {
    setRatingVisible(false);
    navigation.reset({
      index: 1,
      routes: [{ name: PAGES.HOME }, { name: PAGES.PAYWALL }],
    });
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithAppleCredentials();
    } catch {
      // User cancelled or error — still allow proceeding
    }
    completeOnboarding();
  };

  const handleEmailAuth = async () => {
    if (!emailInput.trim() || !passwordInput.trim()) {
      Toast.show({
        type: 'error',
        position: TOAST_POSITION,
        text1: 'Fill in all fields',
        visibilityTime: 2000,
        props: { iconName: 'alert' },
      });
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        await createAccountWithEmail(emailInput.trim(), passwordInput);
      } else {
        await signInWithEmail(emailInput.trim(), passwordInput);
      }
      completeOnboarding();
    } catch (e: any) {
      Toast.show({
        type: 'error',
        position: TOAST_POSITION,
        text1: isSignup ? 'Sign up failed' : 'Sign in failed',
        text2: e?.message ?? 'Please check your credentials',
        visibilityTime: 3000,
        props: { iconName: 'alert' },
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Slide renderers ──────────────────────────────────────────────────────────

  const renderInfoSlide = (item: InfoSlide) => (
    <View style={styles.slide}>
      {/* Hero illustration with concentric halo */}
      <View style={styles.heroContainer}>
        <View style={[styles.haloOuter, { backgroundColor: primary + '0A' }]} />
        <View style={[styles.haloMid,   { backgroundColor: primary + '14' }]} />
        <View style={[styles.haloInner, { backgroundColor: primary + '1F' }]} />
        {item.image ? (
          <Image source={item.image} style={styles.heroImage} resizeMode="contain" />
        ) : (
          <View style={[styles.iconBadge, { backgroundColor: primary }]}>
            <MaterialCommunityIcons name={item.icon!} size={72} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.copyContainer}>
        <Text style={[styles.title, { color: theme['text-basic-color'] }]}>
          {item.title}
        </Text>
        <Text style={[styles.subtitle, { color: theme['text-hint-color'] }]}>
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  const renderSignInSlide = () => (
    <View style={styles.slide}>
      <View style={styles.signInTop}>
        <View style={[styles.shieldCircle, { backgroundColor: primary + '1F' }]}>
          <View style={[styles.shieldCircleInner, { backgroundColor: primary + '33' }]}>
            <MaterialCommunityIcons name="shield-check" size={36} color={primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: theme['text-basic-color'] }]}>
          {emailMode ? (isSignup ? 'Create account' : 'Welcome back') : 'You\'re all set'}
        </Text>
        <Text style={[styles.subtitle, { color: theme['text-hint-color'] }]}>
          {emailMode
            ? 'Sign in to sync your Premium subscription across devices.'
            : 'Sign in to sync Premium across devices — or skip and start using CryptoWarden right away.'}
        </Text>
      </View>

      {!emailMode ? (
        <View style={styles.signInActions}>
          {/* Apple — primary */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.primaryAuthBtn, { backgroundColor: '#000000' }]}
              onPress={handleAppleSignIn}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="apple" size={20} color="#fff" />
              <Text style={styles.primaryAuthText}>Continue with Apple</Text>
            </TouchableOpacity>
          )}

          {/* Google */}
          <TouchableOpacity
            style={[
              styles.secondaryAuthBtn,
              {
                backgroundColor: theme['color-basic-600'],
                borderColor: theme['card-border-color'],
              },
            ]}
            onPress={async () => {
              try {
                await signInWithGoogle();
              } catch {
                // User cancelled — still proceed
              }
              completeOnboarding();
            }}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
            <Text style={[styles.secondaryAuthText, { color: theme['text-basic-color'] }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme['card-border-color'] }]} />
            <Text style={[styles.dividerText, { color: theme['text-hint-color'] }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme['card-border-color'] }]} />
          </View>

          {/* Email — tertiary */}
          <TouchableOpacity
            style={[styles.ghostAuthBtn, { borderColor: theme['card-border-color'] }]}
            onPress={() => setEmailMode(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color={theme['text-basic-color']}
            />
            <Text style={[styles.secondaryAuthText, { color: theme['text-basic-color'] }]}>
              Continue with email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipLink} onPress={completeOnboarding}>
            <Text style={[styles.skipLinkText, { color: theme['text-hint-color'] }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.signInActions}>
          <TouchableOpacity style={styles.backRow} onPress={() => setEmailMode(false)}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={theme['text-hint-color']}
            />
            <Text style={[styles.backRowText, { color: theme['text-hint-color'] }]}>Back</Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Email"
            placeholderTextColor={theme['text-hint-color']}
            value={emailInput}
            onChangeText={setEmailInput}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.input,
              {
                backgroundColor: theme['color-basic-600'],
                color: theme['text-basic-color'],
              },
            ]}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme['text-hint-color']}
            value={passwordInput}
            onChangeText={setPasswordInput}
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: theme['color-basic-600'],
                color: theme['text-basic-color'],
              },
            ]}
          />

          <TouchableOpacity
            style={[styles.primaryAuthBtn, { backgroundColor: primary }]}
            onPress={handleEmailAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryAuthText}>
              {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipLink} onPress={() => setIsSignup(!isSignup)}>
            <Text style={[styles.skipLinkText, { color: primary }]}>
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ── Layout ───────────────────────────────────────────────────────────────────

  return (
    <>
    <StableSafeArea>
      <View style={[styles.root, { backgroundColor: theme['color-basic-500'] }]}>
        {/* Top bar: progress + skip */}
        <View style={styles.topBar}>
          <View style={[styles.progressTrack, { backgroundColor: theme['color-basic-800'] }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: primary,
                  width: `${((activeIndex + 1) / SLIDES.length) * 100}%`,
                },
              ]}
            />
          </View>
          {!isSignInSlide && (
            <TouchableOpacity onPress={completeOnboarding} hitSlop={12}>
              <Text style={[styles.topSkip, { color: theme['text-hint-color'] }]}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Slides */}
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled
          renderItem={({ item }) =>
            item.type === 'info' ? renderInfoSlide(item) : renderSignInSlide()
          }
          onMomentumScrollEnd={e => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActiveIndex(index);
          }}
        />

        {/* Footer CTA (info slides only) */}
        {!isSignInSlide && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: primary }]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>
                {isLastInfoSlide ? 'Get Started' : 'Continue'}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </StableSafeArea>

    <RatingPromptModal visible={ratingVisible} onClose={handleRatingDismissed} />
    </>
  );
}

const HALO_OUTER = 380;
const HALO_MID = 290;
const HALO_INNER = 210;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Top bar ────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 14,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  topSkip: {
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Slide layout ────────────────────────────────────────────────────────────
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 28,
  },

  // ── Hero illustration with halo ─────────────────────────────────────────────
  heroContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  haloOuter: {
    position: 'absolute',
    width: HALO_OUTER,
    height: HALO_OUTER,
    borderRadius: HALO_OUTER / 2,
  },
  haloMid: {
    position: 'absolute',
    width: HALO_MID,
    height: HALO_MID,
    borderRadius: HALO_MID / 2,
  },
  haloInner: {
    position: 'absolute',
    width: HALO_INNER,
    height: HALO_INNER,
    borderRadius: HALO_INNER / 2,
  },
  heroImage: {
    width: 260,
    height: 260,
  },
  iconBadge: {
    width: 140,
    height: 140,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },

  // ── Copy block ──────────────────────────────────────────────────────────────
  copyContainer: {
    paddingBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 14,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },

  // ── Footer CTA ──────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 32,
    paddingTop: 8,
  },
  cta: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Sign-in slide ───────────────────────────────────────────────────────────
  signInTop: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
  },
  shieldCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  shieldCircleInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInActions: {
    paddingBottom: 32,
    gap: 12,
  },
  primaryAuthBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryAuthText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAuthBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryAuthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ghostAuthBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  skipLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  backRowText: {
    fontSize: 14,
    marginLeft: 4,
  },
  input: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
