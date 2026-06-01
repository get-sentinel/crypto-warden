import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RNModal from 'react-native-modal';

import { ChainNetwork } from '../../types/wallet.types';
import {
  CHAIN_NETWORK_META,
  CHAIN_NETWORKS,
  DEFAULT_1x_MARGIN,
  DEFAULT_2x_MARGIN,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_PADDING,
} from '../../utils/constants';

interface Props {
  visible: boolean;
  selected: ChainNetwork;
  onSelect: (chain: ChainNetwork) => void;
  onClose: () => void;
}

export default function ChainPickerModal({ visible, selected, onSelect, onClose }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState('');

  const sorted = useMemo(() => {
    const withoutOther = CHAIN_NETWORKS.filter(c => c !== 'other');
    withoutOther.sort((a, b) =>
      CHAIN_NETWORK_META[a].label.localeCompare(CHAIN_NETWORK_META[b].label),
    );
    return [...withoutOther, 'other' as ChainNetwork];
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(c => CHAIN_NETWORK_META[c].label.toLowerCase().includes(q));
  }, [sorted, search]);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <RNModal
      isVisible={visible}
      onBackdropPress={handleClose}
      onSwipeComplete={handleClose}
      swipeDirection="down"
      propagateSwipe
      style={styles.modal}
    >
      <View style={[styles.sheet, { backgroundColor: theme['color-basic-modal-background'] }]}>
        <View style={[styles.handle, { backgroundColor: theme['transparency-basic-color'] }]} />

        <Text style={[styles.title, { color: theme['text-basic-color'] }]}>
          Network / Chain
        </Text>

        <View style={[styles.searchBar, { backgroundColor: theme['color-basic-500'] }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme['text-hint-color']} />
          <TextInput
            placeholder="Search networks..."
            placeholderTextColor={theme['text-hint-color']}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: theme['text-basic-color'] }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={16}
                color={theme['text-hint-color']}
              />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const meta = CHAIN_NETWORK_META[item];
            const isSelected = item === selected;
            return (
              <TouchableOpacity
                style={[
                  styles.row,
                  isSelected && { backgroundColor: theme['color-primary-600'] },
                ]}
                onPress={() => {
                  onSelect(item);
                  setSearch('');
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.dot, { backgroundColor: meta.color }]} />
                <Text style={[styles.rowLabel, { color: theme['text-basic-color'] }]}>
                  {meta.label}
                </Text>
                {isSelected && (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color={theme['color-primary-500']}
                  />
                )}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => (
            <View
              style={[styles.separator, { backgroundColor: theme['card-border-color'] }]}
            />
          )}
        />
      </View>
    </RNModal>
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
    paddingBottom: 40,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: DEFAULT_2x_MARGIN,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: DEFAULT_2x_MARGIN,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: DEFAULT_CORNER_RADIUS,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: DEFAULT_1x_MARGIN,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: DEFAULT_CORNER_RADIUS,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 30,
  },
});
