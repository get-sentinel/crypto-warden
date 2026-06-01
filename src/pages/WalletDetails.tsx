import React, { useCallback, useEffect, useState } from 'react';
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
import Clipboard from '@react-native-clipboard/clipboard';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import RNModal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { WalletData, ChainNetwork } from '../types/wallet.types';
import { migrateWallet } from '../utils/walletFactory';
import { analyzeSeedFull, SeedStatus } from '../utils/bip39';
import {
  CHAIN_NETWORK_META,
  DEFAULT_1x_MARGIN,
  DEFAULT_2x_MARGIN,
  DEFAULT_3x_MARGIN,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_MODAL_TITLE,
  DEFAULT_PADDING,
  SEED_STATUS_MESSAGE,
  TOAST_POSITION,
} from '../utils/constants';
import { updateWallet } from '../redux/WalletSlice';
import TagChip from '../components/chips/TagChip';
import ChainIcon from '../components/ChainIcon';
import ChainPickerModal from '../components/modals/ChainPickerModal';

const HAPTIC_OPTIONS = { enableVibrateFallback: false, ignoreAndroidSystemSettings: false };

export default function WalletDetails() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const selectedWallet: WalletData = useSelector((state: any) => state.walletSlice.selectedWallet);
  const premium: boolean = useSelector((state: any) => state.accountSlice.premium);

  // Form state — mirrors selectedWallet fields
  const [walletName, setWalletName] = useState('');
  const [walletSeed, setWalletSeed] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletPassword, setWalletPassword] = useState('');
  const [walletNotes, setWalletNotes] = useState('');
  const [walletTagsInput, setWalletTagsInput] = useState('');
  const [walletChain, setWalletChain] = useState<ChainNetwork>('other');

  // UI state
  const [editMode, setEditMode] = useState(false);
  const [seedRevealed, setSeedRevealed] = useState(false);
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const [seedStatus, setSeedStatus] = useState(SeedStatus.EMPTY);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [deletionModalVisible, setDeletionModalVisible] = useState(false);
  const [chainPickerVisible, setChainPickerVisible] = useState(false);

  // Reset form state to the saved wallet values
  const resetForm = useCallback(() => {
    const w = migrateWallet(selectedWallet);
    setWalletName(w.name);
    setWalletSeed(w.seed);
    setWalletAddress(w.address ?? '');
    setWalletPassword(w.password ?? '');
    setWalletNotes(w.notes ?? '');
    setWalletTagsInput((w.tags ?? []).join(', '));
    setWalletChain(w.chain ?? 'other');
    setSeedStatus(analyzeSeedFull(w.seed));
  }, [selectedWallet]);

  // Populate form from selectedWallet on mount
  useEffect(() => {
    resetForm();
  }, [resetForm]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const flashCopied = useCallback((field: string) => {
    setCopiedField(field);
    ReactNativeHapticFeedback.trigger('impactLight', HAPTIC_OPTIONS);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  const copyToClipboard = useCallback(
    (text: string, field: string) => {
      if (!text) return;
      Clipboard.setString(text);
      flashCopied(field);
    },
    [flashCopied],
  );

  const parsedTags = useCallback(() => {
    return walletTagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .slice(0, 10);
  }, [walletTagsInput]);

  const handleUpdate = useCallback(
    (isDeleted = false) => {
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

      const { computeSeedHash } = require('../utils/walletFactory');
      const normalized = walletSeed.trim().toLowerCase().replace(/\s+/g, ' ');

      const updated: WalletData = {
        ...migrateWallet(selectedWallet),
        name: walletName.trim(),
        seed: walletSeed,
        seedHash: computeSeedHash(normalized),
        address: walletAddress.trim() || undefined,
        password: walletPassword.trim() || undefined,
        notes: walletNotes.trim() || undefined,
        tags: parsedTags(),
        chain: walletChain,
        isDeleted,
        updateDate: new Date().toISOString(),
      };

      dispatch(updateWallet({ updatedWallet: updated, synchronizable: false }));
    },
    [
      walletSeed,
      walletName,
      walletAddress,
      walletPassword,
      walletNotes,
      walletTagsInput,
      walletChain,
      selectedWallet,
      parsedTags,
      dispatch,
    ],
  );

  const handleDelete = useCallback(() => {
    handleUpdate(true);
    navigation.goBack();
  }, [handleUpdate, navigation]);

  const handleSaveEdit = useCallback(() => {
    handleUpdate(false);
    setEditMode(false);
  }, [handleUpdate]);

  const handleCancelEdit = useCallback(() => {
    resetForm();
    setEditMode(false);
  }, [resetForm]);

  const chainMeta = CHAIN_NETWORK_META[walletChain];
  const seedWords = walletSeed.trim().split(/\s+/);
  const displayedTags = migrateWallet(selectedWallet).tags ?? [];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme['color-basic-500'] }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

        <View style={[styles.inner, { backgroundColor: theme['color-basic-500'] }]}>
          {/* Toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity
              onPress={editMode ? handleCancelEdit : () => navigation.goBack()}
              style={[styles.iconBtn, { backgroundColor: theme['color-basic-600'] }]}
              hitSlop={6}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={theme['text-basic-color']}
              />
            </TouchableOpacity>
            <Text style={[styles.toolbarTitle, { color: theme['text-basic-color'] }]}>
              {editMode ? 'Edit Wallet' : 'Wallet Details'}
            </Text>
            {editMode ? (
              <TouchableOpacity
                style={[styles.savePill, { backgroundColor: theme['color-primary-500'] }]}
                onPress={handleSaveEdit}
                activeOpacity={0.85}
              >
                <Text style={styles.savePillText}>Save</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setEditMode(true)}
                style={[styles.iconBtn, { backgroundColor: theme['color-basic-600'] }]}
                hitSlop={6}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color={theme['text-basic-color']}
                />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Chain icon + wallet name */}
            <View style={styles.nameRow}>
              <ChainIcon chain={walletChain} size={60} />

              {editMode ? (
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
              ) : (
                <View style={styles.nameView}>
                  <Text style={[styles.walletName, { color: theme['text-basic-color'] }]}>
                    {walletName}
                  </Text>
                  <View
                    style={[
                      styles.chainBadge,
                      { backgroundColor: theme['chain-badge-background'] },
                    ]}
                  >
                    <View style={[styles.chainDot, { backgroundColor: chainMeta?.color }]} />
                    <Text style={[styles.chainLabel, { color: chainMeta?.color }]}>
                      {chainMeta?.label ?? 'Other'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Seed phrase */}
            <FieldCard
              label="Seed Phrase"
              isCopied={copiedField === 'seed'}
              theme={theme}
            >
              <View style={styles.fieldRow}>
                <TouchableOpacity
                  style={styles.fieldTouchable}
                  activeOpacity={0.7}
                  onPress={() =>
                    seedRevealed
                      ? copyToClipboard(walletSeed, 'seed')
                      : setSeedRevealed(true)
                  }
                >
                  <View style={styles.seedWordGrid}>
                    {seedWords.map((word, idx) =>
                      seedRevealed ? (
                        <TouchableOpacity
                          key={`${word}-${idx}`}
                          style={[
                            styles.seedWordChip,
                            { backgroundColor: theme['seed-word-background'] },
                          ]}
                          onPress={() => copyToClipboard(word, `word-${idx}`)}
                          onLongPress={() => copyToClipboard(word, `word-${idx}`)}
                        >
                          <Text style={[styles.seedWordNum, { color: theme['text-hint-color'] }]}>
                            {idx + 1}
                          </Text>
                          <Text style={[styles.seedWordText, { color: theme['seed-word-text'] }]}>
                            {word}
                          </Text>
                          {copiedField === `word-${idx}` && (
                            <Text style={[styles.copiedBadge, { color: theme['color-primary-500'] }]}>
                              ✓
                            </Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View
                          key={`masked-${idx}`}
                          style={[
                            styles.seedWordChip,
                            { backgroundColor: theme['seed-word-background'] },
                          ]}
                        >
                          <Text style={[styles.seedWordNum, { color: theme['text-hint-color'] }]}>
                            {idx + 1}
                          </Text>
                          <View
                            style={[
                              styles.redactionBar,
                              { backgroundColor: theme['text-hint-color'] + '55' },
                            ]}
                          />
                        </View>
                      ),
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSeedRevealed(v => !v)}
                  style={styles.eyeBtn}
                >
                  <MaterialCommunityIcons
                    name={seedRevealed ? 'eye-off' : 'eye'}
                    size={22}
                    color={theme['color-primary-500']}
                  />
                </TouchableOpacity>
              </View>

              {/* Seed status indicator */}
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: SEED_STATUS_MESSAGE[seedStatus]?.color },
                  ]}
                />
                <Text style={[styles.statusText, { color: theme['text-hint-color'] }]}>
                  {SEED_STATUS_MESSAGE[seedStatus]?.message}
                </Text>
              </View>
            </FieldCard>

            {/* Address */}
            {editMode ? (
              <EditField
                label="Wallet Address"
                value={walletAddress}
                onChangeText={setWalletAddress}
                theme={theme}
              />
            ) : walletAddress ? (
              <FieldCard
                label="Wallet Address"
                isCopied={copiedField === 'address'}
                theme={theme}
              >
                <TouchableOpacity
                  onPress={() => copyToClipboard(walletAddress, 'address')}
                  style={styles.fieldTouchable}
                >
                  <Text style={[styles.fieldValue, { color: theme['text-basic-color'] }]}>
                    {walletAddress}
                  </Text>
                </TouchableOpacity>
              </FieldCard>
            ) : null}

            {/* Password */}
            {editMode ? (
              <EditField
                label="Wallet Password"
                value={walletPassword}
                onChangeText={setWalletPassword}
                secureTextEntry
                theme={theme}
              />
            ) : walletPassword ? (
              <FieldCard
                label="Password"
                isCopied={copiedField === 'password'}
                theme={theme}
              >
                <View style={styles.fieldRow}>
                  <TouchableOpacity
                    style={styles.fieldTouchable}
                    onPress={() => copyToClipboard(walletPassword, 'password')}
                  >
                    <Text style={[styles.fieldValue, { color: theme['text-basic-color'] }]}>
                      {passwordRevealed ? walletPassword : '••••••••'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPasswordRevealed(v => !v)}
                    style={styles.eyeBtn}
                  >
                    <MaterialCommunityIcons
                      name={passwordRevealed ? 'eye-off' : 'eye'}
                      size={22}
                      color={theme['color-primary-500']}
                    />
                  </TouchableOpacity>
                </View>
              </FieldCard>
            ) : null}

            {/* Notes */}
            {editMode ? (
              <EditField
                label="Notes"
                value={walletNotes}
                onChangeText={setWalletNotes}
                multiline
                theme={theme}
              />
            ) : walletNotes ? (
              <FieldCard
                label="Notes"
                isCopied={copiedField === 'notes'}
                theme={theme}
              >
                <TouchableOpacity
                  onPress={() => copyToClipboard(walletNotes, 'notes')}
                  style={styles.fieldTouchable}
                >
                  <Text style={[styles.fieldValue, { color: theme['text-basic-color'] }]}>
                    {walletNotes}
                  </Text>
                </TouchableOpacity>
              </FieldCard>
            ) : null}

            {/* Chain picker (edit mode only) */}
            {editMode && (
              <View style={[styles.sectionCard, { backgroundColor: theme['color-basic-600'] }]}>
                <Text style={[styles.sectionLabel, { color: theme['color-primary-500'] }]}>
                  Network / Chain
                </Text>
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
              </View>
            )}

            {/* Tags (edit mode) */}
            {editMode && (
              <View style={[styles.sectionCard, { backgroundColor: theme['color-basic-600'] }]}>
                <Text style={[styles.sectionLabel, { color: theme['color-primary-500'] }]}>
                  Tags
                </Text>
                <TextInput
                  value={walletTagsInput}
                  onChangeText={setWalletTagsInput}
                  style={[styles.tagInput, { color: theme['text-basic-color'] }]}
                  placeholder="DeFi, Cold Storage, NFTs"
                  placeholderTextColor={theme['text-hint-color']}
                  autoCapitalize="none"
                />
              </View>
            )}

            {/* Tags (view mode) */}
            {!editMode && displayedTags.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: theme['color-basic-600'] }]}>
                <Text style={[styles.sectionLabel, { color: theme['color-primary-500'] }]}>
                  Tags
                </Text>
                <View style={styles.tagDisplay}>
                  {displayedTags.map(tag => (
                    <TagChip key={tag} label={tag} />
                  ))}
                </View>
              </View>
            )}

            {/* Delete button (edit mode) */}
            {editMode && (
              <TouchableOpacity
                style={[
                  styles.deleteBtn,
                  { backgroundColor: theme['danger-tint'] },
                ]}
                onPress={() => setDeletionModalVisible(true)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color={theme['danger-color']}
                />
                <Text style={[styles.deleteBtnLabel, { color: theme['danger-color'] }]}>
                  Delete Wallet
                </Text>
              </TouchableOpacity>
            )}
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

      {/* Delete confirmation modal */}
      <RNModal
        isVisible={deletionModalVisible}
        onBackdropPress={() => setDeletionModalVisible(false)}
        onSwipeComplete={() => setDeletionModalVisible(false)}
        swipeDirection="down"
        backdropOpacity={0.6}
        style={styles.modal}
      >
        <View
          style={[styles.deleteSheet, { backgroundColor: theme['color-basic-modal-background'] }]}
        >
          <View style={[styles.handle, { backgroundColor: theme['transparency-basic-color'] }]} />

          <View style={[styles.deleteIconCircle, { backgroundColor: theme['danger-tint'] }]}>
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={32}
              color={theme['danger-color']}
            />
          </View>

          <Text style={[styles.deleteModalTitle, { color: theme['text-basic-color'] }]}>
            Delete this wallet?
          </Text>
          <Text style={[styles.deleteModalBody, { color: theme['text-hint-color'] }]}>
            This removes the wallet from CryptoWarden. Your actual on-chain assets are not affected.
          </Text>

          <TouchableOpacity
            style={[styles.deleteConfirmBtn, { backgroundColor: theme['danger-color'] }]}
            onPress={handleDelete}
            activeOpacity={0.85}
          >
            <Text style={styles.deleteConfirmText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteCancelBtn}
            onPress={() => setDeletionModalVisible(false)}
            hitSlop={8}
          >
            <Text style={[styles.deleteCancelText, { color: theme['text-hint-color'] }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </RNModal>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FieldCard({
  label,
  isCopied,
  children,
  theme,
}: {
  label: string;
  isCopied: boolean;
  children: React.ReactNode;
  theme: Record<string, string>;
}) {
  return (
    <View
      style={[
        fieldCardStyles.card,
        {
          backgroundColor: isCopied ? theme['color-primary-600'] : theme['color-basic-600'],
        },
      ]}
    >
      <Text
        style={[
          fieldCardStyles.label,
          { color: isCopied ? theme['color-primary-500'] : theme['color-primary-500'] },
        ]}
      >
        {isCopied ? 'COPIED ✓' : label}
      </Text>
      {children}
    </View>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  multiline,
  secureTextEntry,
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  secureTextEntry?: boolean;
  theme: Record<string, string>;
}) {
  return (
    <View style={[fieldCardStyles.card, { backgroundColor: theme['color-basic-600'] }]}>
      <Text style={[fieldCardStyles.label, { color: theme['color-primary-500'] }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        style={[
          fieldCardStyles.input,
          { color: theme['text-basic-color'] },
          multiline && fieldCardStyles.multiline,
        ]}
        placeholderTextColor={theme['text-hint-color']}
        autoCapitalize="none"
        autoCorrect={false}
        textAlignVertical={multiline ? 'top' : 'auto'}
      />
    </View>
  );
}

const fieldCardStyles = StyleSheet.create({
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
    marginBottom: 6,
  },
  input: {
    fontSize: 15,
    paddingVertical: 6,
  },
  multiline: {
    minHeight: 60,
    paddingTop: 4,
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
  iconBtn: {
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
    paddingBottom: 80,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DEFAULT_3x_MARGIN,
    gap: DEFAULT_2x_MARGIN,
  },
  nameView: {
    flex: 1,
    gap: 6,
  },
  nameInput: {
    flex: 1,
    height: 56,
    borderRadius: DEFAULT_CORNER_RADIUS,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  walletName: {
    fontSize: 22,
    fontWeight: '700',
  },
  chainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chainDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  chainLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DEFAULT_1x_MARGIN,
  },
  fieldTouchable: {
    flex: 1,
  },
  fieldValue: {
    fontSize: 15,
    lineHeight: 22,
  },
  redactionBar: {
    width: 34,
    height: 6,
    borderRadius: 3,
  },
  eyeBtn: {
    padding: 4,
  },
  seedWordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  seedWordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  seedWordNum: {
    fontSize: 11,
    fontWeight: '500',
    minWidth: 14,
  },
  seedWordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  copiedBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
  },
  sectionCard: {
    borderRadius: DEFAULT_CORNER_RADIUS,
    paddingHorizontal: DEFAULT_1x_MARGIN + 4,
    paddingTop: DEFAULT_1x_MARGIN + 4,
    paddingBottom: DEFAULT_1x_MARGIN,
    marginBottom: DEFAULT_2x_MARGIN,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
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
  tagInput: {
    fontSize: 15,
    paddingVertical: 6,
  },
  tagDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: DEFAULT_CORNER_RADIUS,
    paddingVertical: 14,
    marginTop: DEFAULT_2x_MARGIN,
    marginBottom: DEFAULT_3x_MARGIN,
  },
  deleteBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  deleteSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: DEFAULT_PADDING,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: DEFAULT_2x_MARGIN,
  },
  deleteIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: DEFAULT_MODAL_TITLE,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: DEFAULT_1x_MARGIN,
  },
  deleteModalBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: DEFAULT_3x_MARGIN,
    paddingHorizontal: 8,
  },
  deleteConfirmBtn: {
    width: '100%',
    height: 52,
    borderRadius: DEFAULT_CORNER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DEFAULT_1x_MARGIN,
  },
  deleteConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteCancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteCancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
