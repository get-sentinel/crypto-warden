import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import TagChip from './TagChip';

interface Props {
  tags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  onClearAll: () => void;
}

/**
 * Horizontal scrollable filter bar. Tapping a tag toggles it in the active filter set.
 * "All" is shown when no tags are active and clears the filter when tapped.
 */
export default function TagFilterBar({ tags, activeTags, onToggleTag, onClearAll }: Props) {
  if (tags.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <TagChip
        label="All"
        selected={activeTags.length === 0}
        onPress={onClearAll}
      />
      {tags.map(tag => (
        <TagChip
          key={tag}
          label={tag}
          selected={activeTags.includes(tag)}
          onPress={() => onToggleTag(tag)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
});
