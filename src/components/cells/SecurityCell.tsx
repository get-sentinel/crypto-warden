import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { DEFAULT_CORNER_RADIUS } from '../../utils/constants';

interface SecurityCellProps {
  title: string;
  description: string;
  /** Devices this backend syncs across, e.g. "iOS, macOS, Android" or "N/A". */
  sync: string;
  alert: string;
  iconName: string;
  selected: boolean;
  onPress: () => void;
  /** When provided, a password field is shown while the cell is selected. */
  password?: string;
  setPassword?: (value: string) => void;
}

/** A selectable storage-backend option used on the Security Config screen. */
const SecurityCell = ({
  title,
  description,
  sync,
  alert,
  iconName,
  selected,
  onPress,
  password,
  setPassword,
}: SecurityCellProps) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme['color-basic-600'],
          borderColor: selected ? theme['color-primary-500'] : 'transparent',
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: theme['color-primary-500'] }]}>
          <MaterialCommunityIcons name={iconName} size={18} color="#fff" />
        </View>
        <Text style={[styles.title, { color: theme['text-basic-color'] }]}>{title}</Text>
        <MaterialCommunityIcons
          name={selected ? 'check-circle' : 'circle-outline'}
          size={22}
          color={selected ? theme['color-primary-500'] : theme['text-hint-color']}
        />
      </View>

      <Text style={[styles.description, { color: theme['text-hint-color'] }]}>
        {description}
      </Text>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="sync" size={14} color={theme['text-hint-color']} />
        <Text style={[styles.metaText, { color: theme['text-hint-color'] }]}>
          Syncs across: {sync}
        </Text>
      </View>

      {selected && setPassword && (
        <TextInput
          placeholder="Encryption password"
          placeholderTextColor={theme['text-hint-color']}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.passwordInput,
            {
              backgroundColor: theme['color-basic-500'],
              color: theme['text-basic-color'],
              borderColor: theme['card-border-color'],
            },
          ]}
        />
      )}

      {selected && (
        <View style={styles.alertRow}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={14}
            color={theme['color-warning-500'] ?? '#C9A227'}
          />
          <Text style={[styles.alertText, { color: theme['text-hint-color'] }]}>{alert}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: DEFAULT_CORNER_RADIUS,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    borderRadius: 6,
    padding: 5,
    marginRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  passwordInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: DEFAULT_CORNER_RADIUS,
    paddingHorizontal: 14,
    fontSize: 16,
    marginTop: 12,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});

export default SecurityCell;
