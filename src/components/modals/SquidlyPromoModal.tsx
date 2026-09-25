import React from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RNModal from 'react-native-modal';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import {
  DEFAULT_2x_MARGIN,
  DEFAULT_PADDING,
  SQUIDLY_APP_STORE_DEEP_LINK,
  SQUIDLY_APP_STORE_URL,
  SQUIDLY_BRAND,
} from '../../utils/constants';
import { isSmallScreen } from '../../utils/utils';

import SQUIDLY_ICON from '../../assets/squidly/icon.png';
import SQUIDLY_SCREEN_1 from '../../assets/squidly/screen1.png';
import SQUIDLY_SCREEN_2 from '../../assets/squidly/screen2.png';
import SQUIDLY_SCREEN_3 from '../../assets/squidly/screen3.png';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const FEATURES = [
  { icon: 'eye-off-outline', text: 'Read-only — no seed phrase, no keys' },
  { icon: 'layers-triple-outline', text: '22 chains + 6 exchanges, one balance' },
  { icon: 'chart-donut', text: 'Net worth, allocation and 24h change' },
] as const;

/**
 * One-shot cross-promo for Squidly, our crypto portfolio tracker. Shown once on
 * Home (see SQUIDLY_PROMO_SHOWN_KEY) and reachable any time from Settings.
 * iOS only — Squidly has no Play Store listing.
 */
export default function SquidlyPromoModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const small = isSmallScreen();

  // Prefer the App Store app itself so the CTA lands on an installable page
  // rather than a Safari interstitial; fall back to the web listing.
  //
  // Deliberately no canOpenURL() gate: with no LSApplicationQueriesSchemes entry
  // for itms-apps, RCTLinkingManager *rejects* that query rather than resolving
  // false, so the rejection landed in the catch, openURL was never reached, and
  // the tap did nothing but dismiss the sheet. Attempt-then-fall-back is also
  // what openStoreFallback in Settings does.
  const handleGet = async () => {
    try {
      await Linking.openURL(SQUIDLY_APP_STORE_DEEP_LINK);
    } catch {
      try {
        await Linking.openURL(SQUIDLY_APP_STORE_URL);
      } catch {
        // No App Store and no browser — nothing left to recover from.
      }
    } finally {
      onClose();
    }
  };

  const heroHeight = small ? 196 : 236;
  const shotHeight = small ? 190 : 226;
  const shotWidth = shotHeight * 0.462; // native screenshot aspect ratio

  return (
    <RNModal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      backdropOpacity={0.7}
      // No useNativeDriver: react-native-modal pairs it with swipeDirection by
      // putting raw Animated.Values in the sheet's `transform`, which its own
      // hard-coded `transform: [{translateY: 0}]` then shadows. Animated sees no
      // node left to drive, passes the style through to a plain View, and the
      // transform validator throws on the Animated.Value. Every other modal here
      // omits it too.
      style={styles.modal}
    >
      <View
        style={[
          styles.sheet,
          { backgroundColor: theme['color-basic-modal-background'] },
        ]}
      >
        {/* ── Hero: brand gradient with the app's own screenshots peeking up ── */}
        <View style={[styles.hero, { height: heroHeight }]}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id="squidlyHero" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={SQUIDLY_BRAND.light} />
                <Stop offset="0.55" stopColor={SQUIDLY_BRAND.base} />
                <Stop offset="1" stopColor={SQUIDLY_BRAND.dark} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#squidlyHero)" />
          </Svg>

          {/* Soft light blooms behind the screenshots */}
          <View style={[styles.bloom, styles.bloomLeft]} />
          <View style={[styles.bloom, styles.bloomRight]} />

          <View style={styles.heroHeader}>
            <Image source={SQUIDLY_ICON} style={styles.heroIcon} />
            <View style={styles.heroTitles}>
              <Text style={styles.heroName}>Squidly</Text>
              <Text style={styles.heroTagline}>Crypto Portfolio · Free</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Fanned screenshots, clipped by the hero so they read as "rising up" */}
          <View style={styles.shots} pointerEvents="none">
            <Image
              source={SQUIDLY_SCREEN_2}
              style={[
                styles.shot,
                styles.shotSide,
                { width: shotWidth, height: shotHeight, transform: [{ rotate: '-9deg' }, { translateY: 16 }] },
              ]}
            />
            <Image
              source={SQUIDLY_SCREEN_1}
              style={[
                styles.shot,
                styles.shotCenter,
                { width: shotWidth * 1.12, height: shotHeight * 1.12 },
              ]}
            />
            <Image
              source={SQUIDLY_SCREEN_3}
              style={[
                styles.shot,
                styles.shotSide,
                { width: shotWidth, height: shotHeight, transform: [{ rotate: '9deg' }, { translateY: 16 }] },
              ]}
            />
          </View>
        </View>

        {/* ── Pitch ── */}
        <View style={styles.body}>
          {/* Say plainly whose app this is: the pitch only lands if the trust
              CryptoWarden has already earned carries over to Squidly. */}
          <View style={[styles.byline, { backgroundColor: SQUIDLY_BRAND.light + '1F' }]}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={13}
              color={SQUIDLY_BRAND.light}
            />
            <Text style={[styles.bylineText, { color: SQUIDLY_BRAND.light }]}>
              From the makers of CryptoWarden
            </Text>
          </View>

          <Text style={[styles.title, { color: theme['text-basic-color'] }]}>
            Your portfolio, one number
          </Text>
          <Text style={[styles.subtitle, { color: theme['text-hint-color'] }]}>
            Built by the same developer. CryptoWarden guards your seed phrases
            — Squidly shows what they're worth, in one live net worth.
          </Text>

          <View style={styles.features}>
            {FEATURES.map(feature => (
              <View key={feature.icon} style={styles.featureRow}>
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: SQUIDLY_BRAND.light + '1F' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={feature.icon}
                    size={16}
                    color={SQUIDLY_BRAND.light}
                  />
                </View>
                <Text
                  style={[styles.featureText, { color: theme['text-basic-color'] }]}
                >
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleGet}
            activeOpacity={0.85}
            style={styles.ctaWrapper}
          >
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
              <Defs>
                <LinearGradient id="squidlyCta" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={SQUIDLY_BRAND.light} />
                  <Stop offset="1" stopColor={SQUIDLY_BRAND.base} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#squidlyCta)" />
            </Svg>
            <MaterialCommunityIcons name="apple" size={20} color="#FFFFFF" />
            <Text style={styles.ctaText}>Get Squidly — Free</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.laterBtn} hitSlop={8}>
            <Text style={[styles.laterText, { color: theme['text-hint-color'] }]}>
              Not now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  hero: {
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  bloom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  bloomLeft: {
    top: -90,
    left: -70,
  },
  bloomRight: {
    top: 20,
    right: -110,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DEFAULT_PADDING,
    paddingTop: 18,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
  },
  heroTitles: {
    flex: 1,
    marginLeft: 12,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroTagline: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  shots: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 14,
  },
  shot: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: '#0B0B0F',
  },
  shotSide: {
    marginHorizontal: -10,
  },
  shotCenter: {
    zIndex: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  body: {
    paddingHorizontal: DEFAULT_PADDING,
    paddingTop: DEFAULT_2x_MARGIN,
    paddingBottom: 34,
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  bylineText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },
  features: {
    marginTop: DEFAULT_2x_MARGIN,
    marginBottom: DEFAULT_2x_MARGIN,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  ctaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    // Explicit height, not vertical padding: the gradient <Svg> inside is
    // height="100%", and a percentage only resolves against a parent whose
    // height is already definite. With a padding-derived height it stayed
    // unresolved, so the gradient painted short and the bottom half of the
    // white label landed on the white sheet — invisible. The hero works
    // because it sets an explicit height too.
    height: 52,
    borderRadius: 15,
    overflow: 'hidden',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  laterBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  laterText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
