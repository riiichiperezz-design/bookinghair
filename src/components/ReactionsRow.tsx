import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { colors, radius } from '@/theme';

const REACTIONS = ['❤️', '😂', '🔥', '🥹'] as const;

type Props = {
  onReact?: (emoji: string) => void;
};

/** Fila de reacciones rápidas con emoji. Selección única, con "pop" animado. */
export function ReactionsRow({ onReact }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={styles.row}>
      {REACTIONS.map((emoji) => (
        <ReactionItem
          key={emoji}
          emoji={emoji}
          selected={selected === emoji}
          onPress={() => {
            const next = selected === emoji ? null : emoji;
            setSelected(next);
            if (next) {
              haptics.tap();
              onReact?.(next);
            }
          }}
        />
      ))}
    </View>
  );
}

function ReactionItem({
  emoji,
  selected,
  onPress,
}: {
  emoji: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        scale.value = withSequence(
          withTiming(1.35, { duration: 110 }),
          withSpring(1, { damping: 6, stiffness: 220 })
        );
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Reaccionar ${emoji}`}
    >
      <Animated.View
        style={[styles.item, selected && styles.itemSelected, animatedStyle]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
    </Pressable>
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
  emoji: {
    fontSize: 21,
  },
});
