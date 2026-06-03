import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Divider, Text, TopNavigation, useTheme } from '@ui-kitten/components';
import RNModal from 'react-native-modal';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import PageTitle from '../components/PageTitle';
import SecurityCell from '../components/cells/SecurityCell';
import { switchSecureStorage } from '../storage/StorageManager';
import { WalletData } from '../types/wallet.types';
import {
  BUTTON_FONT_SIZE,
  DEFAULT_2x_MARGIN,
  DEFAULT_3x_MARGIN,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_MODAL_TITLE,
  DEFAULT_PADDING,
  SECURITY_OPTIONS,
} from '../utils/constants';
import { openURL } from '../utils/utils';

const SecurityConfig = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

  const securityOption: string = useSelector((state: any) => state.accountSlice.securityOption);
  const password: string | undefined = useSelector((state: any) => state.accountSlice.password);
  const uid: string | undefined = useSelector((state: any) => state.accountSlice.uid);
  const wallets: WalletData[] = useSelector((state: any) => state.walletSlice.wallets);

  const [selectedOption, setSelectedOption] = useState<string>(securityOption);
  const [newPassword, setNewPassword] = useState<string>(password ?? '');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleteOrigin, setDeleteOrigin] = useState(false);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);

  const hasChanged =
    selectedOption !== securityOption || (newPassword || '') !== (password || '');

  const status = useMemo(() => {
    if (!hasChanged) return { enabled: false, label: "Nothing's changed" };
    if (selectedOption === SECURITY_OPTIONS.SENTINEL && !uid) {
      return { enabled: false, label: 'Sign in to use Sentinel Cloud' };
    }
    if (selectedOption === SECURITY_OPTIONS.SENTINEL && !newPassword) {
      return { enabled: false, label: 'Enter a password to continue' };
    }
    return { enabled: true, label: 'Update Security Config' };
  }, [hasChanged, selectedOption, uid, newPassword]);

  const resetModal = () => {
    setConfirmVisible(false);
    setDeleteOrigin(false);
    setStatusMessages([]);
    setMigrating(false);
    setMigrationDone(false);
  };

  const confirmMigration = async () => {
    setMigrating(true);
    const messages: string[] = [];
    await switchSecureStorage({
      local: wallets,
      oldSecurityOption: securityOption,
      newSecurityOption: selectedOption,
      newPassword: newPassword || undefined,
      oldPassword: password,
      uid,
      deleteOrigin,
      dispatch,
      statusMessage: messages,
      setStatusMessage: setStatusMessages,
    });
    setMigrating(false);
    setMigrationDone(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme['color-basic-500'] }]}>
      <TopNavigation
        style={[styles.topNav, { backgroundColor: theme['color-basic-500'] }]}
        title={(props: any) => <PageTitle title="Security Config" props={props} />}
        accessoryRight={() => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.closeBtn, { backgroundColor: theme['color-basic-600'] }]}
            hitSlop={6}
          >
            <MaterialCommunityIcons name="close" size={18} color={theme['text-basic-color']} />
          </TouchableOpacity>
        )}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.intro, { color: theme['text-hint-color'] }]}>
          Choose where your wallets are stored. Switching merges your data so nothing is lost.
        </Text>

        {Platform.OS !== 'android' && (
          <SecurityCell
            title="iCloud Keychain"
            description="Stored in the iCloud Keychain, managed and secured by Apple."
            sync="iOS, macOS"
            alert="Make sure iCloud Keychain is enabled in Settings → iCloud on this device."
            iconName="apple"
            selected={selectedOption === SECURITY_OPTIONS.ICLOUD}
            onPress={() => setSelectedOption(SECURITY_OPTIONS.ICLOUD)}
          />
        )}

        {Platform.OS === 'android' && (
          <SecurityCell
            title="Encrypted Storage"
            description="Stored locally on this device using Android Encrypted Storage."
            sync="This device only"
            alert="Make sure this device is backed up or you may lose your data."
            iconName="android"
            selected={selectedOption === SECURITY_OPTIONS.E_STORAGE}
            onPress={() => setSelectedOption(SECURITY_OPTIONS.E_STORAGE)}
          />
        )}

        <SecurityCell
          title="Sentinel Cloud"
          description={
            'Encrypted on-device (AES-256) with your password before syncing to Sentinel Cloud. Your password never leaves this device — we cannot decrypt your data.'
          }
          sync="iOS, macOS, Android"
          alert="Don't lose this password — without it your data cannot be recovered."
          iconName="cloud-outline"
          selected={selectedOption === SECURITY_OPTIONS.SENTINEL}
          onPress={() => setSelectedOption(SECURITY_OPTIONS.SENTINEL)}
          password={newPassword}
          setPassword={setNewPassword}
        />

        <Text
          style={[styles.link, { color: theme['color-primary-500'] }]}
          onPress={() => openURL('https://getsentinel.io/security-model?ref=app')}
        >
          Read our Security Model
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          disabled={!status.enabled}
          style={[
            styles.cta,
            {
              backgroundColor: status.enabled
                ? theme['color-primary-500']
                : theme['color-basic-400'],
              borderWidth: 0,
              borderRadius: DEFAULT_CORNER_RADIUS,
            },
          ]}
          onPress={() => setConfirmVisible(true)}
        >
          {(props: any) => (
            <Text
              {...props}
              style={{
                color: status.enabled ? '#fff' : theme['text-hint-color'],
                fontWeight: '600',
                fontSize: BUTTON_FONT_SIZE,
              }}
            >
              {status.label}
            </Text>
          )}
        </Button>
      </View>

      <RNModal
        isVisible={confirmVisible}
        onBackdropPress={() => !migrating && resetModal()}
        onSwipeComplete={() => !migrating && resetModal()}
        swipeDirection={migrating ? undefined : 'down'}
        style={styles.modal}
      >
        <View
          style={[
            styles.modalCard,
            { backgroundColor: theme['color-basic-modal-background'] },
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme['text-basic-color'] }]}>
            Migrate your wallets?
          </Text>

          {!migrationDone && statusMessages.length === 0 && (
            <>
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: theme['text-basic-color'] }]}>
                  Remove data from the old storage after migrating
                </Text>
                <Switch
                  value={deleteOrigin}
                  onValueChange={setDeleteOrigin}
                  trackColor={{ true: theme['color-primary-500'] }}
                />
              </View>
              <Text style={[styles.note, { color: theme['text-hint-color'] }]}>
                Your local and remote wallets will be merged so nothing is lost.
                {selectedOption === SECURITY_OPTIONS.SENTINEL &&
                (newPassword || '') !== (password || '')
                  ? ' You changed your password — enter the same one on your other devices to decrypt.'
                  : ''}
              </Text>
            </>
          )}

          {statusMessages.length > 0 && (
            <>
              <Divider style={[styles.divider, { backgroundColor: theme['card-border-color'] }]} />
              {statusMessages.map((m, i) => (
                <Text key={`${i}-${m}`} style={[styles.note, { color: theme['text-basic-color'] }]}>
                  {m}
                </Text>
              ))}
            </>
          )}

          {migrationDone ? (
            <Button
              style={[styles.modalBtn, { backgroundColor: theme['color-primary-500'], borderWidth: 0, borderRadius: DEFAULT_CORNER_RADIUS }]}
              onPress={resetModal}
            >
              {(props: any) => (
                <Text {...props} style={{ color: '#fff', fontWeight: '600', fontSize: BUTTON_FONT_SIZE }}>
                  Done
                </Text>
              )}
            </Button>
          ) : (
            <View style={styles.modalActions}>
              <Button
                appearance="ghost"
                disabled={migrating}
                style={styles.modalGhost}
                onPress={resetModal}
              >
                {(props: any) => (
                  <Text {...props} style={{ color: theme['text-hint-color'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE }}>
                    Cancel
                  </Text>
                )}
              </Button>
              <Button
                disabled={migrating}
                style={[styles.modalBtn, { flex: 1, backgroundColor: theme['color-primary-500'], borderWidth: 0, borderRadius: DEFAULT_CORNER_RADIUS }]}
                onPress={confirmMigration}
              >
                {(props: any) => (
                  <Text {...props} style={{ color: '#fff', fontWeight: '600', fontSize: BUTTON_FONT_SIZE }}>
                    {migrating ? 'Migrating…' : 'Migrate'}
                  </Text>
                )}
              </Button>
            </View>
          )}
        </View>
      </RNModal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  topNav: { paddingTop: 15, paddingHorizontal: DEFAULT_PADDING },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: DEFAULT_PADDING,
    paddingTop: 16,
    paddingBottom: 24,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  link: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: DEFAULT_PADDING,
    paddingBottom: 32,
    paddingTop: 8,
  },
  cta: {
    width: '100%',
    height: 52,
  },
  modal: { justifyContent: 'flex-end', margin: 0 },
  modalCard: {
    paddingHorizontal: DEFAULT_2x_MARGIN,
    paddingTop: DEFAULT_3x_MARGIN,
    paddingBottom: DEFAULT_3x_MARGIN,
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: DEFAULT_MODAL_TITLE,
    fontWeight: '600',
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  divider: {
    width: '100%',
    marginVertical: 14,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  modalGhost: {
    borderWidth: 0,
  },
  modalBtn: {
    height: 50,
    marginTop: 24,
  },
});

export default SecurityConfig;
