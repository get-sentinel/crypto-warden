import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { WalletData, ChainNetwork } from '../types/wallet.types';
import { createWallet, findDuplicateBySeedHash, findDuplicateByAddress, computeSeedHash } from '../utils/walletFactory';
import { analyzeSeedFull, SeedStatus } from '../utils/bip39';
import {
  CHAIN_NETWORK_META,
  DEFAULT_1x_MARGIN,
  DEFAULT_2x_MARGIN,
  DEFAULT_3x_MARGIN,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_PADDING,
  SEED_STATUS_MESSAGE,
  TOAST_POSITION,
} from '../utils/constants';
import { addNewWallet } from '../redux/WalletSlice';
import ChainIcon from '../components/ChainIcon';
import DuplicateWalletModal from '../components/modals/DuplicateWalletModal';
import ChainPickerModal from '../components/modals/ChainPickerModal';

export default function AddWallet() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const wallets: WalletData[] = useSelector((state: any) => state.walletSlice.wallets);
  const premium: boolean = useSelector((state: any) => state.accountSlice.premium);

  const [walletName, setWalletName] = useState('My Wallet');
  const [walletSeed, setWalletSeed] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletPassword, setWalletPassword] = useState('');
  const [walletNotes, setWalletNotes] = useState('');
  const [walletTags, setWalletTags] = useState('');
  const [walletChain, setWalletChain] = useState<ChainNetwork>('other');
  const [seedStatus, setSeedStatus] = useState(SeedStatus.EMPTY);
  const [chainPickerVisible, setChainPickerVisible] = useState(false);
  const [duplicateWallet, setDuplicateWallet] = useState<WalletData | undefined>();

  const handleSeedChange = useCallback((value: string) => {
    setWalletSeed(value);
    setSeedStatus(analyzeSeedFull(value));
  }, []);

  const parsedTags = useCallback(() => {
    return walletTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .slice(0, 10);
  }, [walletTags]);

  const doSave = useCallback(() => {
    const newWallet = createWallet({
      idPool: wallets.map(w => w.id),
      name: walletName.trim(),
      seed: walletSeed,
      chain: walletChain,
      address: walletAddress.trim() || undefined,
      password: walletPassword.trim() || undefined,
      notes: walletNotes.trim() || undefined,
      tags: parsedTags(),
    });
    dispatch(addNewWallet({ newWallet, synchronizable: premium }));
    setDuplicateWallet(undefined);
    navigation.goBack();
  }, [
    wallets,
    walletName,
    walletSeed,
    walletChain,
    walletAddress,
    walletPassword,
    walletNotes,
    parsedTags,
    dispatch,
    premium,
    navigation,
  ]);

  const handleSave = useCallback(() => {
    if (!walletSeed.trim() || !walletName.trim()) {
      Toast.show({
        type: 'error',
        position: TOAST_POSITION,
        text1: 'Missing fields',
        text2: 'Name and seed phrase are required',
        visibilityTime: 2000,
        props: { iconName: 'alert' },
      });
      return;
    }

    const normalized = walletSeed.trim().toLowerCase().replace(/\s+/g, ' ');
    const hash = computeSeedHash(normalized);
    const dupBySeed = findDuplicateBySeedHash(hash, wallets);
    const dupByAddr = walletAddress.trim()
      ? findDuplicateByAddress(walletAddress.trim(), wallets)
      : undefined;

    if (dupBySeed || dupByAddr) {
      setDuplicateWallet(dupBySeed ?? dupByAddr);
      return;
    }

    doSave();
  }, [walletSeed, walletName, walletAddress, wallets, doSave]);

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme['color-basic-500'] }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

        <View style={[styles.inner, { backgroundColor: theme['color-basic-500'] }]}>
          {/* Header */}
          <View style={styles.toolbar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.closeBtn, { backgroundColor: theme['color-basic-600'] }]}
              hitSlop={6}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={theme['text-basic-color']}
              />
            </TouchableOpacity>
            <Text style={[styles.toolbarTitle, { color: theme['text-basic-color'] }]}>
              New Wallet
            </Text>
            <TouchableOpacity
              style={[styles.savePill, { backgroundColor: theme['color-primary-500'] }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.savePillText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Chain icon + wallet name */}
            <View style={styles.nameRow}>
              <ChainIcon chain={walletChain} size={60} />

              <TextInput
                value={walletName}
                onChangeText={setWalletName}
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: theme['color-basic-600'],
                    color: theme['text-basic-color'],
                  },
                ]}
                placeholderTextColor={theme['text-hint-color']}
              />
            </View>

            {/* Seed phrase */}
            <SectionCard title="Seed Phrase *" theme={theme}>
              <TextInput
                value={walletSeed}
                onChangeText={handleSeedChange}
                multiline
                style={[styles.seedInput, { color: theme['text-basic-color'] }]}
                placeholder="word1 word2 word3 ..."
                placeholderTextColor={theme['text-hint-color']}
                autoCapitalize="none"
                autoCorrect={false}
                textAlignVertical="top"
              />
              <View style={styles.seedStatus}>
                <View
                  style={[styles.statusDot, { backgroundColor: SEED_STATUS_MESSAGE[seedStatus]?.color }]}
                />
                <Text style={[styles.statusText, { color: theme['text-hint-color'] }]}>
                  {SEED_STATUS_MESSAGE[seedStatus]?.message}
                </Text>
              </View>
            </SectionCard>

            {/* Chain network picker */}
            <SectionCard title="Network / Chain" theme={theme}>
              <TouchableOpacity
                style={styles.chainTrigger}
                onPress={() => setChainPickerVisible(true)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.chainTriggerDot,
                    { backgroundColor: CHAIN_NETWORK_META[walletChain].color },
                  ]}
                />
                <Text style={[styles.chainTriggerLabel, { color: theme['text-basic-color'] }]}>
                  {CHAIN_NETWORK_META[walletChain].label}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={18}
                  color={theme['text-hint-color']}
                />
              </TouchableOpacity>
            </SectionCard>

            {/* Address */}
            <SectionCard title="Wallet Address (optional)" theme={theme}>
              <TextInput
                value={walletAddress}
                onChangeText={setWalletAddress}
                style={[styles.fieldInput, { color: theme['text-basic-color'] }]}
                placeholder="0x71C7656EC7ab88b098defB75..."
                placeholderTextColor={theme['text-hint-color']}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </SectionCard>

            {/* Password */}
            <SectionCard title="Wallet Password (optional)" theme={theme}>
              <TextInput
                value={walletPassword}
                onChangeText={setWalletPassword}
                style={[styles.fieldInput, { color: theme['text-basic-color'] }]}
                secureTextEntry
                placeholder="Password or passphrase"
                placeholderTextColor={theme['text-hint-color']}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </SectionCard>

            {/* Notes */}
            <SectionCard title="Notes (optional)" theme={theme}>
              <TextInput
                value={walletNotes}
                onChangeText={setWalletNotes}
                multiline
                style={[styles.notesInput, { color: theme['text-basic-color'] }]}
                placeholder="Derivation path, hints, or any context..."
                placeholderTextColor={theme['text-hint-color']}
                textAlignVertical="top"
              />
            </SectionCard>

            {/* Tags */}
            <SectionCard title="Tags (optional)" theme={theme}>
              <TextInput
                value={walletTags}
                onChangeText={setWalletTags}
                style={[styles.fieldInput, { color: theme['text-basic-color'] }]}
                placeholder="DeFi, Cold Storage, NFTs (comma-separated)"
                placeholderTextColor={theme['text-hint-color']}
                autoCapitalize="none"
              />
              {parsedTags().length > 0 && (
                <View style={styles.tagsPreview}>
                  {parsedTags().map(t => (
                    <View
                      key={t}
                      style={[styles.tagPreviewChip, { backgroundColor: theme['tag-chip-background'] }]}
                    >
                      <Text style={[styles.tagPreviewLabel, { color: theme['tag-chip-text'] }]}>
                        {t}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>
          </ScrollView>
        </View>
      </View>

      {/* Chain picker modal */}
      <ChainPickerModal
        visible={chainPickerVisible}
        selected={walletChain}
        onSelect={setWalletChain}
        onClose={() => setChainPickerVisible(false)}
      />

      {/* Provider selection modal */}
      {/* Duplicate detection modal */}
      {duplicateWallet && (
        <DuplicateWalletModal
          existingWallet={duplicateWallet}
          onSaveAnyway={doSave}
          onCancel={() => setDuplicateWallet(undefined)}
        />
      )}
    </>
  );
}

// Small helper to avoid repetition in form sections
function SectionCard({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: Record<string, string>;
}) {
  return (
    <View style={[sectionStyles.card, { backgroundColor: theme['color-basic-600'] }]}>
      <Text style={[sectionStyles.label, { color: theme['color-primary-500'] }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  card: {
    borderRadius: DEFAULT_CORNER_RADIUS,
    paddingHorizontal: DEFAULT_1x_MARGIN + 4,
    paddingTop: DEFAULT_1x_MARGIN + 4,
    paddingBottom: DEFAULT_1x_MARGIN,
    marginBottom: DEFAULT_2x_MARGIN,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: DEFAULT_PADDING,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DEFAULT_3x_MARGIN,
    gap: DEFAULT_2x_MARGIN,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  savePill: {
    paddingHorizontal: 18,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DEFAULT_2x_MARGIN,
    gap: DEFAULT_2x_MARGIN,
  },
  nameInput: {
    flex: 1,
    height: 56,
    borderRadius: DEFAULT_CORNER_RADIUS,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  seedInput: {
    fontSize: 15,
    minHeight: 90,
    paddingTop: 4,
    paddingBottom: 4,
  },
  fieldInput: {
    fontSize: 15,
    paddingVertical: 6,
  },
  notesInput: {
    fontSize: 15,
    minHeight: 70,
    paddingTop: 4,
    paddingBottom: 4,
  },
  seedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    flex: 1,
  },
  chainTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  chainTriggerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chainTriggerLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  tagsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 6,
  },
  tagPreviewChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagPreviewLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
