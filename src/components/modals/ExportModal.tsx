import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RNModal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';

import { WalletData } from '../../types/wallet.types';
import { exportWallets } from '../../utils/exportManager';
import {
  DEFAULT_1x_MARGIN,
  DEFAULT_2x_MARGIN,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_PADDING,
  TOAST_POSITION,
} from '../../utils/constants';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const MIN_PASSWORD_LENGTH = 8;

export default function ExportModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const wallets: WalletData[] = useSelector((state: any) =>
    (state.walletSlice.wallets as WalletData[]).filter(w => !w.isDeleted),
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const isValid =
    password.length >= MIN_PASSWORD_LENGTH && passwordsMatch && wallets.length > 0;

  const primary = theme['color-primary-500'];

  const handleExport = async () => {
    if (!isValid) return;
    setIsExporting(true);
    try {
      await exportWallets(wallets, password);
      handleClose();
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        Toast.show({
          type: 'error',
          position: TOAST_POSITION,
          text1: 'Export failed',
          text2: 'Something went wrong. Please try again.',
          visibilityTime: 3000,
          props: { iconName: 'alert' },
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    onClose();
  };

  const showMismatch = confirmPassword.length > 0 && !passwordsMatch;

  return (
    <RNModal
      isVisible={visible}
      onBackdropPress={handleClose}
      onSwipeComplete={handleClose}
      swipeDirection="down"
      backdropOpacity={0.6}
      style={styles.modal}
    >
      <View style={[styles.sheet, { backgroundColor: theme['color-basic-modal-background'] }]}>
        <View style={[styles.handle, { backgroundColor: theme['transparency-basic-color'] }]} />

        <View style={[styles.iconCircle, { backgroundColor: primary + '1F' }]}>
          <MaterialCommunityIcons name="export-variant" size={28} color={primary} />
        </View>

        <Text style={[styles.title, { color: theme['text-basic-color'] }]}>Export Wallets</Text>

        <View style={[styles.warningBox, { backgroundColor: theme['danger-tint'] }]}>
          <MaterialCommunityIcons
            name="alert"
            size={16}
            color={theme['danger-color']}
            style={{ marginRight: 8, marginTop: 1 }}
          />
          <Text style={[styles.warningText, { color: theme['danger-color'] }]}>
            Store this password safely — it cannot be recovered. Without it your export cannot be decrypted.
          </Text>
        </View>

        <View
          style={[
            styles.inputRow,
            { backgroundColor: theme['color-basic-600'] },
          ]}
        >
          <TextInput
            style={[styles.input, { color: theme['text-basic-color'] }]}
            placeholder={`Encryption password (min ${MIN_PASSWORD_LENGTH} chars)`}
            placeholderTextColor={theme['text-hint-color']}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={8}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={theme['text-hint-color']}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: theme['color-basic-600'],
              borderColor: showMismatch ? theme['danger-color'] : 'transparent',
              borderWidth: showMismatch ? 1 : 0,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: theme['text-basic-color'] }]}
            placeholder="Confirm password"
            placeholderTextColor={theme['text-hint-color']}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.criteria}>
          <CriteriaRow
            met={password.length >= MIN_PASSWORD_LENGTH}
            text={`At least ${MIN_PASSWORD_LENGTH} characters`}
            theme={theme}
          />
          <CriteriaRow
            met={password.length > 0 && passwordsMatch}
            text="Passwords match"
            theme={theme}
          />
        </View>

        <Text style={[styles.metaText, { color: theme['text-hint-color'] }]}>
          {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} will be exported · AES-256-CBC encrypted
        </Text>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { backgroundColor: isValid ? primary : primary + '55' },
          ]}
          disabled={!isValid || isExporting}
          onPress={handleExport}
          activeOpacity={0.85}
        >
          {isExporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="share-variant" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Export & Share</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleClose} style={styles.cancelBtn} hitSlop={8}>
          <Text style={[styles.cancelText, { color: theme['text-hint-color'] }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </RNModal>
  );
}

function CriteriaRow({
  met,
  text,
  theme,
}: {
  met: boolean;
  text: string;
  theme: Record<string, string>;
}) {
  const color = met ? '#4CAF50' : theme['text-hint-color'];
  return (
    <View style={styles.criteriaRow}>
      <MaterialCommunityIcons
        name={met ? 'check-circle' : 'circle-outline'}
        size={15}
        color={color}
      />
      <Text style={[styles.criteriaText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: DEFAULT_PADDING,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'stretch',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: DEFAULT_2x_MARGIN,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: DEFAULT_CORNER_RADIUS,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: DEFAULT_CORNER_RADIUS,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  criteria: {
    gap: 6,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 2,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criteriaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaText: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 14,
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: DEFAULT_CORNER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
