import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, useTheme, Card } from '@ui-kitten/components';
import Modal from 'react-native-modal';
import { WalletData } from '../../types/wallet.types';
import { DEFAULT_CORNER_RADIUS, DEFAULT_2x_MARGIN, DEFAULT_3x_MARGIN } from '../../utils/constants';

interface Props {
  existingWallet: WalletData;
  onSaveAnyway: () => void;
  onCancel: () => void;
}

/** Shown when the user attempts to save a wallet with a seed or address that already exists. */
export default function DuplicateWalletModal({ existingWallet, onSaveAnyway, onCancel }: Props) {
  const theme = useTheme();

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
        <Text
          category="h6"
          style={[styles.title, { color: theme['text-basic-color'] }]}
        >
          Duplicate Wallet
        </Text>

        <Text
          category="p2"
          style={[styles.body, { color: theme['text-hint-color'] }]}
        >
          A wallet with this seed phrase already exists:{'\n'}
          <Text
            category="s1"
            style={{ color: theme['color-primary-500'] }}
          >
            {existingWallet.name}
          </Text>
          {'\n\n'}
          Do you still want to save this wallet?
        </Text>

        <View style={styles.buttonRow}>
          <Button
            style={styles.cancelButton}
            appearance="ghost"
            status="basic"
            onPress={onCancel}
          >
            Cancel
          </Button>
          <Button
            style={styles.saveButton}
            status="warning"
            onPress={onSaveAnyway}
          >
            Save Anyway
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
    paddingTop: DEFAULT_3x_MARGIN,
    paddingBottom: 36,
  },
  title: {
    marginBottom: DEFAULT_2x_MARGIN,
    fontWeight: '700',
  },
  body: {
    lineHeight: 22,
    marginBottom: DEFAULT_3x_MARGIN,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: DEFAULT_2x_MARGIN,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});
