import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/theme';

const REACTIONS = ['❤️', '😂', '🔥', '🥹'] as const;

/** Fila de reacciones rápidas con emoji. Selección única y toggle. */
export function ReactionsRow() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={styles.row}>
      {REACTIONS.map((emoji) => {
        const isSelected = selected === emoji;
        return (
          <Pressable
            key={emoji}
            onPress={() => setSelected(isSelected ? null : emoji)}
            style={({ pressed }) => [
              styles.item,
              isSelected && styles.itemSelected,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Reaccionar ${emoji}`}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 11,
  },
  item: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSelected: {
    borderColor: colors.ember,
    backgroundColor: colors.surfaceElevated,
  },
  pressed: {
    opacity: 0.7,
  },
  emoji: {
    fontSize: 21,
  },
});
