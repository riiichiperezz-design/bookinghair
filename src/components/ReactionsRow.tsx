import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  ReactionIcon,
  type ReactionName,
  REACTION_NAMES,
} from '@/components/ReactionIcons';
import { haptics } from '@/lib/haptics';
import { colors, fonts } from '@/theme';

type Props = {
  onReact?: (reaction: ReactionName) => void;
};

/** Fila de reacciones con iconos brasa animados y etiqueta. Selección única. */
export function ReactionsRow({ onReact }: Props) {
  const [selected, setSelected] = useState<ReactionName | null>(null);

  return (
    <View style={styles.row}>
      {REACTION_NAMES.map((name) => (
        <ReactionButton
          key={name}
          name={name}
          selected={selected === name}
          onPress={() => {
            const next = selected === name ? null : name;
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

function ReactionButton({
  name,
  selected,
  onPress,
}: {
  name: ReactionName;
  selected: boolean;
  onPress: () => void;
}) {
  const [nonce, setNonce] = useState(0);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const fire = () => {
    setNonce((n) => n + 1);
    scale.value = withSequence(
      withTiming(0.9, { duration: 70 }),
      withSpring(1, { damping: 6, stiffness: 260 })
    );
    glow.value = withSequence(
      withTiming(1, { duration: 130 }),
      withTiming(0, { duration: 520 })
    );
  };

  return (
    <Pressable
      onPress={() => {
        fire();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={name}
      style={styles.item}
    >
      <View style={styles.circleWrap}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View
          style={[styles.circle, selected && styles.circleSelected, wrapStyle]}
        >
          <ReactionIcon
            name={name}
            size={30}
            nonce={nonce}
            color={selected ? colors.emberBright : colors.ember}
          />
        </Animated.View>
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  item: {
    alignItems: 'center',
    gap: 6,
  },
  circleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelected: {
    borderWidth: 1.5,
    borderColor: colors.emberBright,
    backgroundColor: colors.surfaceElevated,
  },
  glow: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.ember,
  },
  label: {
    fontFamily: fonts.label,
    fontSize: 11,
    color: colors.textMuted,
  },
  labelSelected: {
    color: colors.emberBright,
  },
});
