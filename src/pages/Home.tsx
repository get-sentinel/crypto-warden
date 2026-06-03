import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
  Image,
} from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RNModal from 'react-native-modal';
import Purchases from 'react-native-purchases';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import { RefreshControl } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { WalletData } from '../types/wallet.types';
import { addNewWalletFromURL, sortWallets } from '../utils/utils';
import {
  DEFAULT_1x_MARGIN,
  DEFAULT_2x_MARGIN,
  DEFAULT_3x_MARGIN,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_PADDING,
  PAGES,
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

import DEFAULT_IMAGE from '../assets/onboarding/onboarding1.png';
// checkPremium is in the gitignored src/iap/ directory — copy revenueCatConfig.template.json and PurchaseIAP.template.ts to set up locally
const { checkPremium } = require('../iap/PurchaseIAP');
const revenueCatConfig = require('../revenueCatConfig/revenueCatConfig.json');

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

  const wallets: WalletData[] = useSelector((state: any) => state.walletSlice.wallets);
  const pendingURLWallet: WalletData | undefined = useSelector(
    (state: any) => state.walletSlice.pendingURLWallet,
  );
  const securityOption: string = useSelector((state: any) => state.accountSlice.securityOption);
  const uid: string | undefined = useSelector((state: any) => state.accountSlice.uid);
  const password: string | undefined = useSelector((state: any) => state.accountSlice.password);

  const [sorting, setSorting] = useState(0);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);

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

  // ── Derived data ─────────────────────────────────────────────────────────────

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
    await getWalletsAndDispatch({ dispatch, securityOption, uid, password, local: wallets });
    Toast.show({
      type: 'success',
      position: TOAST_POSITION,
      text1: 'Sync completed',
      text2: 'Your wallets are up to date',
      visibilityTime: 2000,
      props: { iconName: 'check-circle' },
    });
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
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate(PAGES.SETTINGS)}
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={26}
                color={theme['unselected-icon-color']}
              />
            </TouchableOpacity>

            <View style={styles.toolbarRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setSortModalVisible(true)}
              >
                <MaterialCommunityIcons
                  name={SORT_OPTIONS[sorting].icon}
                  size={26}
                  color={theme['unselected-icon-color']}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme['color-primary-500'] }]}
                onPress={handleAddWallet}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: theme['text-basic-color'], fontWeight: TOP_NAV_TITLE_WEIGHT as any },
            ]}
          >
            CryptoWarden
          </Text>

          {/* Search bar */}
          <View style={[styles.searchBar, { backgroundColor: theme['color-basic-600'] }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={theme['text-hint-color']} />
            <TextInput
              placeholder="Search wallets..."
              placeholderTextColor={theme['text-hint-color']}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: theme['text-basic-color'] }]}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Tag filter bar */}
          <TagFilterBar
            tags={allTags}
            activeTags={activeTags}
            onToggleTag={handleToggleTag}
            onClearAll={() => setActiveTags([])}
          />

          {/* Wallet list or empty state */}
          {displayedWallets.length > 0 ? (
            <FlatList
              data={displayedWallets}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <WalletCell
                  item={item}
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
                  <Image
                    source={DEFAULT_IMAGE}
                    style={styles.emptyImage}
                    resizeMode="contain"
                  />
                  <Text
                    style={[styles.emptyText, { color: theme['text-hint-color'] }]}
                  >
                    {"CryptoWarden keeps your seed phrases encrypted on your device.\nOnly you can access them.\n\nAnd it's open-source."}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.syncButton,
                      { backgroundColor: theme['color-primary-500'] },
                    ]}
                    onPress={handleSync}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="cloud-sync-outline" size={20} color="#fff" />
                    <Text style={styles.syncButtonText}>Sync Wallets</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={[styles.emptyText, { color: theme['text-hint-color'] }]}>
                  No wallets match your search.
                </Text>
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
  emptyImage: {
    width: '100%',
    maxHeight: 260,
    marginBottom: DEFAULT_3x_MARGIN,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: DEFAULT_3x_MARGIN,
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
