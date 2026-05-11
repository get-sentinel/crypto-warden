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
import { Button, Text, useTheme } from '@ui-kitten/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Purchases from 'react-native-purchases';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import { RefreshControl } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { WalletData } from '../types/wallet.types';
import { addNewWalletFromURL, getNextSorting, sortWallets } from '../utils/utils';
import {
  BUTTON_FONT_SIZE,
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
import { setAuthenticated, setPremium, setSentinelPremium, setUID } from '../redux/AccountSlice';
import { fetchWallets } from '../storage/KeychainManager';
import StableSafeArea from '../components/safeArea/StableSafeArea';
import WalletCell from '../components/cells/WalletCell';
import TagFilterBar from '../components/chips/TagFilterBar';
import URLImportConfirmModal from '../components/modals/URLImportConfirmModal';

import DEFAULT_IMAGE from '../assets/onboarding/onboarding1.png';
// checkPremium is in the gitignored src/iap/ directory — copy revenueCatConfig.template.json and PurchaseIAP.template.ts to set up locally
const { checkPremium } = require('../iap/PurchaseIAP');
const revenueCatConfig = require('../revenueCatConfig/revenueCatConfig.json');

const SORT_ICONS = [
  'sort-calendar-ascending',
  'sort-calendar-descending',
  'sort-alphabetical-ascending',
  'sort-alphabetical-descending',
];

export default function Home() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

  const wallets: WalletData[] = useSelector((state: any) => state.walletSlice.wallets);
  const premium: boolean = useSelector((state: any) => state.accountSlice.premium);
  const pendingURLWallet: WalletData | undefined = useSelector(
    (state: any) => state.walletSlice.pendingURLWallet,
  );

  const [sorting, setSorting] = useState(0);
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

  useEffect(() => {
    fetchWallets({ dispatch, synchronizable: premium });
  }, [premium]);

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
    if (premium || wallets.length < 1) {
      navigation.navigate(PAGES.ADD);
    } else {
      navigation.navigate(PAGES.PAYWALL);
    }
  }, [premium, wallets.length, navigation]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchWallets({ dispatch, synchronizable: premium });
    setIsRefreshing(false);
  }, [dispatch, premium]);

  const handleSync = useCallback(() => {
    fetchWallets({ dispatch, synchronizable: premium });
    if (!premium) {
      Toast.show({
        type: 'info',
        position: TOAST_POSITION,
        text1: 'Upgrade required',
        text2: 'Upgrade to Warden Plus to enable syncing',
        visibilityTime: 2000,
        props: { iconName: 'alert' },
      });
    } else {
      Toast.show({
        type: 'success',
        position: TOAST_POSITION,
        text1: 'Sync completed',
        text2: 'Your wallets are up to date',
        visibilityTime: 2000,
        props: { iconName: 'check-circle' },
      });
    }
  }, [dispatch, premium]);

  const handleToggleTag = useCallback((tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleConfirmURLWallet = useCallback(() => {
    if (!pendingURLWallet) return;
    dispatch(addNewWallet({ newWallet: pendingURLWallet, synchronizable: premium }));
    dispatch(setPendingURLWallet(undefined));
    Toast.show({
      type: 'success',
      position: TOAST_POSITION,
      text1: 'Wallet imported',
      text2: `"${pendingURLWallet.name}" has been saved.`,
      visibilityTime: 2000,
    });
  }, [dispatch, pendingURLWallet, premium]);

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
                onPress={() => setSorting(getNextSorting(sorting))}
              >
                <MaterialCommunityIcons
                  name={SORT_ICONS[sorting]}
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
              contentContainerStyle={[
                styles.listContent,
                { backgroundColor: theme['color-basic-600'], borderColor: theme['card-border-color'] },
              ]}
              ItemSeparatorComponent={() => (
                <View
                  style={[
                    styles.separator,
                    { backgroundColor: theme['card-border-color'] },
                  ]}
                />
              )}
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
                    {"CryptoWarden keeps your seed phrases secured in iCloud Keychain.\nOnly you can access them.\n\nAnd it's open-source."}
                  </Text>
                  <Button
                    style={styles.syncButton}
                    onPress={handleSync}
                  >
                    Sync Wallets
                  </Button>
                </>
              ) : (
                <Text style={[styles.emptyText, { color: theme['text-hint-color'] }]}>
                  No wallets match your search.
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Premium upsell banner */}
        {!premium && sortedWallets.length > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate(PAGES.PAYWALL)}
            style={styles.upsellWrapper}
          >
            <View
              style={[
                styles.upsellBanner,
                {
                  backgroundColor: theme['color-basic-600'],
                  borderColor: theme['transparency-basic-color'],
                },
              ]}
            >
              <MaterialCommunityIcons
                name="shield-alert"
                size={22}
                color={theme['color-primary-500']}
              />
              <Text
                style={[styles.upsellText, { color: theme['text-basic-color'] }]}
              >
                Enable sync to protect your wallets from device loss →
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </StableSafeArea>

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
    borderRadius: DEFAULT_CORNER_RADIUS,
    paddingHorizontal: 12,
    height: 44,
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
    borderRadius: DEFAULT_CORNER_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
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
    width: '100%',
    borderRadius: DEFAULT_CORNER_RADIUS,
  },
  upsellWrapper: {
    paddingHorizontal: DEFAULT_PADDING,
    paddingBottom: 32,
    paddingTop: DEFAULT_1x_MARGIN,
  },
  upsellBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: DEFAULT_CORNER_RADIUS,
    borderWidth: 1,
    paddingHorizontal: DEFAULT_2x_MARGIN,
    paddingVertical: DEFAULT_1x_MARGIN + 4,
    gap: DEFAULT_1x_MARGIN,
  },
  upsellText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
