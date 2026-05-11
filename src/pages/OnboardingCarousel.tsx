import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Text, useTheme } from '@ui-kitten/components';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import StableSafeArea from '../components/safeArea/StableSafeArea';
import {
  DEFAULT_2x_MARGIN,
  DEFAULT_3x_MARGIN,
  DEFAULT_CORNER_RADIUS,
  TOAST_POSITION,
  BUTTON_FONT_SIZE,
} from '../utils/constants';
import {
  signInWithAppleCredentials,
  signInWithGoogle,
  signInWithEmail,
  createAccountWithEmail,
} from '../firebase/firebaseAuth';

import ONBOARDING1 from '../assets/onboarding/onboarding1.png';
import ONBOARDING2 from '../assets/onboarding/onboarding2.png';
import ONBOARDING3 from '../assets/onboarding/onboarding3.png';
import ONBOARDING4 from '../assets/onboarding/onboarding4.png';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';

type SlideType = 'info' | 'signin';

interface InfoSlide {
  type: 'info';
  image: any;
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
    image: ONBOARDING2,
    title: 'Copy in seconds',
    subtitle: 'Retrieve any saved seed phrase instantly — no digging through paper backups.',
  },
  {
    type: 'info',
    image: ONBOARDING3,
    title: 'iCloud Keychain protected',
    subtitle: 'Your seed phrases are encrypted in your personal iCloud Keychain — never on our servers.',
  },
  {
    type: 'info',
    image: ONBOARDING4,
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

  const infoSlides = SLIDES.filter(s => s.type === 'info') as InfoSlide[];
  const isLastInfoSlide = activeIndex === infoSlides.length - 1;
  const isSignInSlide = activeIndex === SLIDES.length - 1;

  const handleNext = () => {
    const next = activeIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  };

  const completeOnboarding = async () => {
    await markOnboardingComplete();
    navigation.replace('home');
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
      Toast.show({ type: 'error', position: TOAST_POSITION, text1: 'Fill in all fields', visibilityTime: 2000, props: { iconName: 'alert' } });
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

  const renderInfoSlide = (item: InfoSlide) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <Text style={[styles.title, { color: theme['text-basic-color'] }]}>{item.title}</Text>
      <Text style={[styles.subtitle, { color: theme['text-hint-color'] }]}>{item.subtitle}</Text>
    </View>
  );

  const renderSignInSlide = () => (
    <View style={styles.slide}>
      <View style={styles.signInHeader}>
        <View style={[styles.signInIconCircle, { backgroundColor: theme['color-primary-600'] }]}>
          <MaterialCommunityIcons name="shield-check" size={40} color={theme['color-primary-500']} />
        </View>
        <Text style={[styles.title, { color: theme['text-basic-color'] }]}>
          {emailMode ? (isSignup ? 'Create Account' : 'Sign In') : 'Get Started'}
        </Text>
        <Text style={[styles.subtitle, { color: theme['text-hint-color'] }]}>
          {emailMode
            ? 'Sign in to sync your Premium subscription across devices.'
            : 'Create an account to sync your Premium across devices — or skip and get started now.'}
        </Text>
      </View>

      {!emailMode ? (
        <View style={styles.signInButtons}>
          {/* Apple */}
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme['color-basic-900'] }]}
            onPress={handleAppleSignIn}
          >
            <MaterialCommunityIcons name="apple" size={20} color="#fff" style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          {/* Google */}
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme['color-basic-600'], borderWidth: 1, borderColor: theme['card-border-color'] }]}
            onPress={async () => {
              try {
                await signInWithGoogle();
              } catch {
                // User cancelled or error — still allow continuing
              }
              completeOnboarding();
            }}
          >
            <MaterialCommunityIcons name="google" size={20} color="#EA4335" style={styles.socialIcon} />
            <Text style={[styles.socialButtonText, { color: theme['text-basic-color'] }]}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme['color-primary-500'] }]}
            onPress={() => setEmailMode(true)}
          >
            <MaterialCommunityIcons name="email-outline" size={20} color="#fff" style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Continue with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={completeOnboarding}>
            <Text style={[styles.skipText, { color: theme['text-hint-color'] }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.signInButtons}>
          <TouchableOpacity style={styles.backRow} onPress={() => setEmailMode(false)}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={theme['text-hint-color']} />
            <Text style={[styles.skipText, { color: theme['text-hint-color'], marginLeft: 4 }]}>Back</Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Email"
            placeholderTextColor={theme['text-hint-color']}
            value={emailInput}
            onChangeText={setEmailInput}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.emailInput, {
              backgroundColor: theme['color-basic-600'],
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
              backgroundColor: theme['color-basic-600'],
              color: theme['text-basic-color'],
              borderColor: theme['card-border-color'],
            }]}
          />

          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme['color-primary-500'] }]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            <Text style={styles.socialButtonText}>
              {loading ? 'Please wait…' : isSignup ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={() => setIsSignup(!isSignup)}>
            <Text style={[styles.skipText, { color: theme['color-primary-500'] }]}>
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <StableSafeArea>
      <View style={[styles.root, { backgroundColor: theme['color-basic-500'] }]}>
        {/* Skip (only on info slides) */}
        {!isSignInSlide && (
          <TouchableOpacity style={styles.skipTopButton} onPress={completeOnboarding}>
            <Text style={[styles.skipText, { color: theme['text-hint-color'] }]}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Slides */}
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          renderItem={({ item }) =>
            item.type === 'info' ? renderInfoSlide(item) : renderSignInSlide()
          }
          onMomentumScrollEnd={e => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActiveIndex(index);
          }}
        />

        {/* Dots + Next button (only on info slides) */}
        {!isSignInSlide && (
          <View style={styles.footer}>
            <View style={styles.dots}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === activeIndex ? theme['color-primary-500'] : theme['text-hint-color'],
                      width: i === activeIndex ? 20 : 8,
                    },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme['color-primary-500'] }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {isLastInfoSlide ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </StableSafeArea>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  skipTopButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 15,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  image: {
    width: '100%',
    flex: 1,
    maxHeight: 300,
    marginBottom: DEFAULT_3x_MARGIN,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: DEFAULT_2x_MARGIN,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
    gap: DEFAULT_2x_MARGIN,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: '100%',
    height: 52,
    borderRadius: DEFAULT_CORNER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  // Sign-in slide
  signInHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: DEFAULT_3x_MARGIN,
  },
  signInIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DEFAULT_2x_MARGIN,
  },
  signInButtons: {
    width: '100%',
    paddingBottom: 40,
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
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emailInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: DEFAULT_CORNER_RADIUS,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
  },
});
