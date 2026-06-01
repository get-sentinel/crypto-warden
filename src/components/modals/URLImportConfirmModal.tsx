import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, useTheme, Card } from '@ui-kitten/components';
import Modal from 'react-native-modal';
import { WalletData } from '../../types/wallet.types';
import ChainIcon from '../ChainIcon';
import {
  CHAIN_NETWORK_META,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_2x_MARGIN,
  DEFAULT_3x_MARGIN,
} from '../../utils/constants';

interface Props {
  wallet: WalletData;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Shown when a cryptowarden:// deep-link requests to save a wallet.
 * Requires explicit user confirmation before persisting — prevents silent injection attacks.
 */
export default function URLImportConfirmModal({ wallet, onConfirm, onCancel }: Props) {
  const theme = useTheme();

  const maskedSeed = (() => {
    const words = wallet.seed.trim().split(/\s+/);
    if (words.length <= 2) return '••••••••';
    return `${words[0]} ••• ${words[words.length - 1]}`;
  })();

  const chain = wallet.chain ?? 'other';
  const chainLabel = CHAIN_NETWORK_META[chain].label;

  return (
    <Modal
      isVisible
      backdropOpacity={0.6}
      onBackdropPress={onCancel}
      style={styles.modal}
    >
      <Card
        style={[
          styles.card,
          { backgroundColor: theme['color-basic-modal-background'] },
        ]}
        disabled
      >
        {/* Warning banner */}
        <View style={[styles.warningBanner, { backgroundColor: 'rgba(222,160,0,0.12)' }]}>
          <Text style={[styles.warningText, { color: '#C9A227' }]}>
            An external app is requesting to import a wallet. Only confirm if you initiated this.
          </Text>
        </View>

        {/* Wallet preview */}
        <View style={styles.walletRow}>
          <View style={styles.chainIconWrap}>
            <ChainIcon chain={chain} size={44} />
          </View>
          <View style={styles.walletInfo}>
            <Text category="h6" style={{ color: theme['text-basic-color'] }}>
              {wallet.name}
            </Text>
            <Text category="c1" style={{ color: theme['text-hint-color'] }}>
              {chainLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.seedRow, { backgroundColor: theme['seed-word-background'] }]}>
          <Text category="c1" style={{ color: theme['text-hint-color'] }}>
            Seed preview
          </Text>
          <Text category="s2" style={{ color: theme['text-basic-color'], marginTop: 4 }}>
            {maskedSeed}
          </Text>
          {wallet.address ? (
            <Text category="c1" style={{ color: theme['text-hint-color'], marginTop: 4 }}>
              Address: {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
            </Text>
          ) : null}
        </View>

        <View style={styles.buttonRow}>
          <Button
            style={styles.cancelButton}
            appearance="ghost"
            status="basic"
            onPress={onCancel}
          >
            Discard
          </Button>
          <Button
            style={styles.confirmButton}
            status="primary"
            onPress={onConfirm}
          >
            Save Wallet
          </Button>
        </View>
      </Card>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  card: {
    borderRadius: DEFAULT_CORNER_RADIUS * 2,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: DEFAULT_3x_MARGIN,
    paddingTop: DEFAULT_2x_MARGIN,
    paddingBottom: 36,
  },
  warningBanner: {
    borderRadius: DEFAULT_CORNER_RADIUS,
    padding: DEFAULT_2x_MARGIN,
    marginBottom: DEFAULT_2x_MARGIN,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DEFAULT_2x_MARGIN,
  },
  chainIconWrap: {
    marginRight: DEFAULT_2x_MARGIN,
  },
  walletInfo: {
    flex: 1,
  },
  seedRow: {
    borderRadius: DEFAULT_CORNER_RADIUS,
    padding: DEFAULT_2x_MARGIN,
    marginBottom: DEFAULT_2x_MARGIN,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: DEFAULT_2x_MARGIN,
    marginTop: DEFAULT_2x_MARGIN,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});
