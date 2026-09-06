import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  NativeEventEmitter,
  NativeModules,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RNModal from 'react-native-modal';
import Purchases from 'react-native-purchases';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import { RefreshControl } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { WalletData } from '../types/wallet.types';
import { addNewWalletFromURL, sortWallets } from '../utils/utils';
import {
  DEFAULT_1x_MARGIN,
  DEFAULT_2x_MARGIN,
  DEFAULT_3x_MARGIN,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_PADDING,
  PAGES,
  SQUIDLY_PROMO_SHOWN_KEY,
  TOAST_POSITION,
  TOP_NAV_TITLE_SIZE,
  TOP_NAV_TITLE_WEIGHT,
} from '../utils/constants';
import { setSelectedWallet, addNewWallet, setPendingURLWallet } from '../redux/WalletSlice';
import {
  setAuthenticated,
  setPassword,
  setSecurityOption,
  setUID,
} from '../redux/AccountSlice';
import { getFromLocalStorage, getWalletsAndDispatch } from '../storage/StorageManager';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';
import StableSafeArea from '../components/safeArea/StableSafeArea';
import WalletCell from '../components/cells/WalletCell';
import TagFilterBar from '../components/chips/TagFilterBar';
import URLImportConfirmModal from '../components/modals/URLImportConfirmModal';
import SquidlyPromoModal from '../components/modals/SquidlyPromoModal';
import FadeSlideIn from '../components/animated/FadeSlideIn';
import FloatingHero from '../components/animated/FloatingHero';
import PressableScale from '../components/animated/PressableScale';
import PulseHalo from '../components/animated/PulseHalo';
import { useReduceMotion } from '../utils/useReduceMotion';

import DEFAULT_IMAGE from '../assets/onboarding/onboarding1.png';
// checkPremium is in the gitignored src/iap/ directory — copy revenueCatConfig.template.json and PurchaseIAP.template.ts to set up locally
const { checkPremium } = require('../iap/PurchaseIAP');
const revenueCatConfig = require('../revenueCatConfig/revenueCatConfig.json');

// Let the Home transition settle before the cross-promo sheet slides up.
const SQUIDLY_PROMO_DELAY_MS = 900;

// Entrance offsets, in milliseconds. The chrome resolves top-down before the
// wallet rows cascade in (WalletCell owns its own per-row stagger).
const ENTER_TITLE_MS = 60;
const ENTER_SEARCH_MS = 120;
const ENTER_TAGS_MS = 170;
const ENTER_EMPTY_TEXT_MS = 220;
const ENTER_EMPTY_CTA_MS = 300;

// Intrinsic aspect ratio of the wallet-grid artwork (5385x3465). The hero box is
// sized from it and the image simply fills that box. Sizing the image from its
// own intrinsic dimensions instead lets RN's measured height (3465pt) leak into
// the animated wrapper — which, unlike the flex parent it used to sit directly
// in, has nothing to bound it — and shoves the copy far below the fold.
const HERO_ASPECT_RATIO = 5385 / 3465;

const SORT_OPTIONS = [
  { icon: 'sort-calendar-ascending',    label: 'Date (oldest first)' },
  { icon: 'sort-calendar-descending',   label: 'Date (newest first)' },
  { icon: 'sort-alphabetical-ascending', label: 'Name (A → Z)' },
  { icon: 'sort-alphabetical-descending', label: 'Name (Z → A)' },
] as const;

export default function Home() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const wallets: WalletData[] = useSelector((state: any) => state.walletSlice.wallets);
  const pendingURLWallet: WalletData | undefined = useSelector(
    (state: any) => state.walletSlice.pendingURLWallet,
  );
  const securityOption: string = useSelector((state: any) => state.accountSlice.securityOption);
  const uid: string | undefined = useSelector((state: any) => state.accountSlice.uid);
  const password: string | undefined = useSelector((state: any) => state.accountSlice.password);
  const isLocked: boolean = useSelector((state: any) => state.settingsSlice.isLocked);

  const [sorting, setSorting] = useState(0);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [squidlyPromoVisible, setSquidlyPromoVisible] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const squidlyPromoHandled = useRef(false);

  const reduceMotion = useReduceMotion();
  const searchFocus = useRef(new Animated.Value(0)).current;
  const sortPop = useRef(new Animated.Value(1)).current;
  const syncSpin = useRef(new Animated.Value(0)).current;
  const sortSettled = useRef(false);

  // ── Setup ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        if (Platform.OS === 'ios') {
          await Purchases.configure({ apiKey: revenueCatConfig.apple_api_key });
        }
      } catch (e) {
        console.warn('[RevenueCat] configure failed:', e);
      }
    };

    initRevenueCat();
    checkPremium(dispatch);

    const unsubFirebase = auth().onAuthStateChanged(async user => {
      if (user) {
        dispatch(setAuthenticated(true));
        dispatch(setUID(user.uid));
        await Purchases.logIn(user.uid).catch(() => {});
      } else {
        dispatch(setAuthenticated(false));
        dispatch(setUID(undefined));
      }
    });

    const emitter = new NativeEventEmitter(NativeModules.EventEmitter);
    const urlListener = emitter.addListener('url', (url: string) => {
      addNewWalletFromURL(dispatch, url, wallets);
    });

    return () => {
      unsubFirebase();
      urlListener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bootstrap the stored storage backend + encryption password (kept on-device).
  // Migrating users already have these in their keychain from the production app,
  // so this is what makes their Sentinel Cloud wallets load again.
  useEffect(() => {
    (async () => {
      const storedOption = await getFromLocalStorage({
        key: LOCAL_STORAGE_KEYS.SECURITY_OPTION,
      });
      dispatch(setSecurityOption(storedOption)); // null → platform default
      const storedPassword = await getFromLocalStorage({
        key: LOCAL_STORAGE_KEYS.PASSWORD,
      });
      if (storedPassword) dispatch(setPassword(storedPassword));
    })();
  }, [dispatch]);

  // Load wallets from the active backend. Re-runs when the backend, sign-in (uid,
  // needed for Sentinel Cloud), or password becomes available.
  useEffect(() => {
    if (!securityOption) return;
    getWalletsAndDispatch({ dispatch, securityOption, uid, password });
  }, [dispatch, securityOption, uid, password]);

  // One-shot Squidly cross-promo. Gated on Home actually being focused so it can
  // never stack on top of the paywall/onboarding hand-off or the biometric lock
  // screen, and on iOS because Squidly has no Play Store listing.
  useEffect(() => {
    if (Platform.OS !== 'ios' || !isFocused || isLocked || squidlyPromoHandled.current) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        if (await AsyncStorage.getItem(SQUIDLY_PROMO_SHOWN_KEY)) {
          squidlyPromoHandled.current = true;
          return;
        }
        // Recorded before showing, so force-quitting the app with the sheet open
        // doesn't bring the promo back on the next launch.
        await AsyncStorage.setItem(SQUIDLY_PROMO_SHOWN_KEY, 'true');
        squidlyPromoHandled.current = true;
        if (!cancelled) setSquidlyPromoVisible(true);
      } catch {
        // A cross-promo is never worth breaking Home over.
      }
    }, SQUIDLY_PROMO_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isFocused, isLocked]);

  // ── Animations ───────────────────────────────────────────────────────────────

  // Accent ring around the search field, tied to focus.
  useEffect(() => {
    Animated.timing(searchFocus, {
      toValue: searchFocused ? 1 : 0,
      duration: reduceMotion ? 0 : 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, searchFocus, searchFocused]);

  // Pop the toolbar icon whenever the order changes — the choice is made inside
  // a sheet that is already dismissed by the time the icon swaps, so without
  // this the only feedback is a glyph quietly changing behind the backdrop.
  useEffect(() => {
    if (!sortSettled.current) {
      sortSettled.current = true; // Skip the mount, animate every change after.
      return;
    }
    if (reduceMotion) return;

    sortPop.setValue(0);
    const pop = Animated.spring(sortPop, {
      toValue: 1,
      friction: 5,
      tension: 90,
      useNativeDriver: true,
    });
    pop.start();

    return () => pop.stop();
  }, [reduceMotion, sortPop, sorting]);

  // Spin the cloud glyph for as long as a sync is actually in flight.
  useEffect(() => {
    if (!isSyncing || reduceMotion) {
      syncSpin.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(syncSpin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();

    return () => loop.stop();
  }, [isSyncing, reduceMotion, syncSpin]);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const sortIconStyle = useMemo(
    () => ({
      transform: [
        { scale: sortPop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
        { rotate: sortPop.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] }) },
      ],
    }),
    [sortPop],
  );

  const syncIconStyle = useMemo(
    () => ({
      transform: [
        { rotate: syncSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
      ],
    }),
    [syncSpin],
  );

  const sortedWallets = useMemo(() => sortWallets(wallets, sorting), [wallets, sorting]);

  const allTags = useMemo(
    () =>
      Array.from(
        new Set(wallets.flatMap(w => w.tags ?? []).filter(Boolean)),
      ).sort(),
    [wallets],
  );

  const displayedWallets = useMemo(() => {
    let result = sortedWallets;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        w =>
          w.name.toLowerCase().includes(q) ||
          (w.address ?? '').toLowerCase().includes(q) ||
          (w.notes ?? '').toLowerCase().includes(q),
      );
    }
    if (activeTags.length > 0) {
      result = result.filter(w => w.tags?.some(t => activeTags.includes(t)));
    }
    return result;
  }, [sortedWallets, searchQuery, activeTags]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleAddWallet = useCallback(() => {
    // Wallets are free and unlimited — no premium gate.
    navigation.navigate(PAGES.ADD);
  }, [navigation]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await getWalletsAndDispatch({ dispatch, securityOption, uid, password, local: wallets });
    setIsRefreshing(false);
  }, [dispatch, securityOption, uid, password, wallets]);

  const handleSync = useCallback(async () => {
    // Sync is free for everyone.
    setIsSyncing(true);
    try {
      await getWalletsAndDispatch({ dispatch, securityOption, uid, password, local: wallets });
      Toast.show({
        type: 'success',
        position: TOAST_POSITION,
        text1: 'Sync completed',
        text2: 'Your wallets are up to date',
        visibilityTime: 2000,
        props: { iconName: 'check-circle' },
      });
    } finally {
      setIsSyncing(false);
    }
  }, [dispatch, securityOption, uid, password, wallets]);

  const handleToggleTag = useCallback((tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleConfirmURLWallet = useCallback(() => {
    if (!pendingURLWallet) return;
    dispatch(addNewWallet({ newWallet: pendingURLWallet, securityOption, uid, password }));
    dispatch(setPendingURLWallet(undefined));
    Toast.show({
      type: 'success',
      position: TOAST_POSITION,
      text1: 'Wallet imported',
      text2: `"${pendingURLWallet.name}" has been saved.`,
      visibilityTime: 2000,
    });
  }, [dispatch, pendingURLWallet, securityOption, uid, password]);

  const handleDiscardURLWallet = useCallback(() => {
    dispatch(setPendingURLWallet(undefined));
  }, [dispatch]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <StableSafeArea>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

        <View style={[styles.container, { backgroundColor: theme['color-basic-500'] }]}>

          {/* Toolbar */}
          <FadeSlideIn>
            <View style={styles.toolbar}>
              <PressableScale
                style={styles.iconButton}
                scaleTo={0.85}
                onPress={() => navigation.navigate(PAGES.SETTINGS)}
              >
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={26}
                  color={theme['unselected-icon-color']}
                />
              </PressableScale>

              <View style={styles.toolbarRight}>
                <PressableScale
                  style={styles.iconButton}
                  scaleTo={0.85}
                  onPress={() => setSortModalVisible(true)}
                >
                  <Animated.View style={sortIconStyle}>
                    <MaterialCommunityIcons
                      name={SORT_OPTIONS[sorting].icon}
                      size={26}
                      color={theme['unselected-icon-color']}
                    />
                  </Animated.View>
                </PressableScale>
                <PressableScale
                  style={[styles.addButton, { backgroundColor: theme['color-primary-500'] }]}
                  scaleTo={0.88}
                  onPress={handleAddWallet}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
                </PressableScale>
              </View>
            </View>
          </FadeSlideIn>

          {/* Title */}
          <FadeSlideIn delay={ENTER_TITLE_MS}>
            <Text
              style={[
                styles.title,
                { color: theme['text-basic-color'], fontWeight: TOP_NAV_TITLE_WEIGHT as any },
              ]}
            >
              CryptoWarden
            </Text>
          </FadeSlideIn>

          {/* Search bar */}
          <FadeSlideIn delay={ENTER_SEARCH_MS}>
            <View style={[styles.searchBar, { backgroundColor: theme['color-basic-600'] }]}>
              {/* Focus ring drawn as an overlay so it can fade on the native
                  driver — animating borderColor would fall back to JS. */}
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  styles.searchRing,
                  { borderColor: theme['color-primary-500'], opacity: searchFocus },
                ]}
              />
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={searchFocused ? theme['color-primary-500'] : theme['text-hint-color']}
              />
              <TextInput
                placeholder="Search wallets..."
                placeholderTextColor={theme['text-hint-color']}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={[styles.searchInput, { color: theme['text-basic-color'] }]}
                clearButtonMode="while-editing"
              />
            </View>
          </FadeSlideIn>

          {/* Tag filter bar */}
          <FadeSlideIn delay={ENTER_TAGS_MS}>
            <TagFilterBar
              tags={allTags}
              activeTags={activeTags}
              onToggleTag={handleToggleTag}
              onClearAll={() => setActiveTags([])}
            />
          </FadeSlideIn>

          {/* Wallet list or empty state */}
          {displayedWallets.length > 0 ? (
            <FlatList
              data={displayedWallets}
              keyExtractor={item => String(item.id)}
              renderItem={({ item, index }) => (
                <WalletCell
                  item={item}
                  index={index}
                  onPress={() => {
                    dispatch(setSelectedWallet(item));
                    navigation.navigate(PAGES.WALLET_DETAILS);
                  }}
                />
              )}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              style={styles.list}
            />
          ) : (
            <View style={styles.emptyState}>
              {wallets.length === 0 ? (
                <>
                  <FloatingHero
                    source={DEFAULT_IMAGE}
                    glowColor={theme['color-primary-500']}
                    style={styles.emptyHero}
                    imageStyle={styles.emptyImage}
                  />
                  <FadeSlideIn delay={ENTER_EMPTY_TEXT_MS}>
                    <Text
                      style={[styles.emptyText, { color: theme['text-hint-color'] }]}
                    >
                      {"CryptoWarden keeps your seed phrases encrypted on your device.\nOnly you can access them.\n\nAnd it's open-source."}
                    </Text>
                  </FadeSlideIn>
                  <FadeSlideIn delay={ENTER_EMPTY_CTA_MS} style={styles.syncButtonWrapper}>
                    <PulseHalo
                      color={theme['color-primary-500']}
                      borderRadius={styles.syncButton.borderRadius}
                    />
                    <PressableScale
                      style={[
                        styles.syncButton,
                        { backgroundColor: theme['color-primary-500'] },
                      ]}
                      scaleTo={0.97}
                      onPress={handleSync}
                    >
                      <Animated.View style={syncIconStyle}>
                        <MaterialCommunityIcons
                          name="cloud-sync-outline"
                          size={20}
                          color="#fff"
                        />
                      </Animated.View>
                      <Text style={styles.syncButtonText}>
                        {isSyncing ? 'Syncing…' : 'Sync Wallets'}
                      </Text>
                    </PressableScale>
                  </FadeSlideIn>
                </>
              ) : (
                <FadeSlideIn>
                  <Text style={[styles.emptyText, { color: theme['text-hint-color'] }]}>
                    No wallets match your search.
                  </Text>
                </FadeSlideIn>
              )}
            </View>
          )}
        </View>

      </StableSafeArea>

      {/* Sort picker modal */}
      <RNModal
        isVisible={sortModalVisible}
        onBackdropPress={() => setSortModalVisible(false)}
        onSwipeComplete={() => setSortModalVisible(false)}
        swipeDirection="down"
        style={styles.modal}
      >
        <View style={[styles.sortSheet, { backgroundColor: theme['color-basic-modal-background'] }]}>
          <View style={[styles.handle, { backgroundColor: theme['transparency-basic-color'] }]} />
          <Text style={[styles.sortTitle, { color: theme['text-basic-color'] }]}>
            Sort wallets
          </Text>
          {SORT_OPTIONS.map((opt, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.sortRow,
                idx === sorting && { backgroundColor: theme['color-primary-600'] },
              ]}
              onPress={() => {
                setSorting(idx);
                setSortModalVisible(false);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={opt.icon}
                size={20}
                color={idx === sorting ? theme['color-primary-500'] : theme['text-hint-color']}
              />
              <Text
                style={[
                  styles.sortLabel,
                  { color: idx === sorting ? theme['color-primary-500'] : theme['text-basic-color'] },
                ]}
              >
                {opt.label}
              </Text>
              {idx === sorting && (
                <MaterialCommunityIcons
                  name="check"
                  size={18}
                  color={theme['color-primary-500']}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </RNModal>

      <SquidlyPromoModal
        visible={squidlyPromoVisible}
        onClose={() => setSquidlyPromoVisible(false)}
      />

      {/* URL import confirmation dialog */}
      {pendingURLWallet && (
        <URLImportConfirmModal
          wallet={pendingURLWallet}
          onConfirm={handleConfirmURLWallet}
          onCancel={handleDiscardURLWallet}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: DEFAULT_PADDING,
    paddingTop: DEFAULT_2x_MARGIN,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DEFAULT_1x_MARGIN,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TOP_NAV_TITLE_SIZE,
    marginTop: DEFAULT_2x_MARGIN,
    marginBottom: DEFAULT_2x_MARGIN,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
    marginBottom: DEFAULT_1x_MARGIN,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  searchRing: {
    borderRadius: 22,
    borderWidth: 2,
  },
  list: {
    marginTop: DEFAULT_2x_MARGIN,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: DEFAULT_3x_MARGIN,
  },
  emptyHero: {
    width: '100%',
    aspectRatio: HERO_ASPECT_RATIO,
    maxHeight: 260,
    marginBottom: DEFAULT_3x_MARGIN,
  },
  emptyImage: {
    width: '100%',
    height: '100%',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: DEFAULT_3x_MARGIN,
  },
  syncButtonWrapper: {
    width: '100%',
  },
  syncButton: {
    flexDirection: 'row',
    width: '100%',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#4F8EF7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sortSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: DEFAULT_PADDING,
    paddingTop: 12,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: DEFAULT_2x_MARGIN,
  },
  sortTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: DEFAULT_2x_MARGIN,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: DEFAULT_CORNER_RADIUS,
  },
  sortLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
