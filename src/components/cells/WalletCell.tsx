import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WalletData } from '../../types/wallet.types';
import { CHAIN_NETWORK_META } from '../../utils/constants';
import { cropWalletAddress } from '../../utils/utils';
import TagChip from '../chips/TagChip';
import ChainIcon from '../ChainIcon';

interface Props {
  item: WalletData;
  onPress: () => void;
}

export default function WalletCell({ item, onPress }: Props) {
  const theme = useTheme();
  const chainMeta = item.chain ? CHAIN_NETWORK_META[item.chain] : undefined;
  const accentColor = chainMeta?.color ?? theme['text-hint-color'];
  const visibleTags = (item.tags ?? []).slice(0, 2);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme['color-basic-600'] }]}
      activeOpacity={0.75}
    >
      {/* Chain icon */}
      <View style={styles.icon}>
        <ChainIcon chain={item.chain ?? 'other'} size={44} />
      </View>

      {/* Wallet info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, { color: theme['text-basic-color'] }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {chainMeta && (
            <View
              style={[
                styles.chainBadge,
                { backgroundColor: accentColor + '22' },
              ]}
            >
              <View style={[styles.chainDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.chainLabel, { color: accentColor }]}>
                {chainMeta.label}
              </Text>
            </View>
          )}
        </View>

        {item.address && (
          <Text
            style={[styles.address, { color: theme['text-hint-color'] }]}
            numberOfLines={1}
          >
            {cropWalletAddress(item.address)}
          </Text>
        )}

        {visibleTags.length > 0 && (
          <View style={styles.tagRow}>
            {visibleTags.map(tag => (
              <TagChip key={tag} label={tag} />
            ))}
          </View>
        )}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={theme['text-hint-color']}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 10,
    minHeight: 76,
    paddingLeft: 14,
  },
  icon: {
    marginRight: 14,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
    paddingRight: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  chainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  chainDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  chainLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  address: {
    fontSize: 12,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  chevron: {
    marginRight: 12,
  },
});
