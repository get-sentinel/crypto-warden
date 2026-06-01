import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  style?: ViewStyle;
}

export default function TagChip({ label, selected, onPress, onRemove, style }: Props) {
  const theme = useTheme();

  const bgColor = selected
    ? theme['color-primary-500']
    : theme['tag-chip-background'];
  const textColor = selected ? '#ffffff' : theme['tag-chip-text'];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: bgColor }, style]}
    >
      <Text style={[styles.label, { color: textColor }]}>
        {label}
        {onRemove ? '  ×' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
});
