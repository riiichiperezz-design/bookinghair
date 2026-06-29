import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { colors } from '@/theme';

const REACTIONS = ['❤️', '😂', '🔥', '🥹', '😮'] as const;

type Props = {
  onReact?: (emoji: string) => void;
};

/** Fila de reacciones con "pop", brillo y un estallido de emojis que suben. */
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

type Particle = { id: number; dx: number };

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
  const glow = useSharedValue(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);

  const removeParticle = useCallback((id: number) => {
    setParticles((ps) => ps.filter((p) => p.id !== id));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const burst = () => {
    // Pop del botón
    scale.value = withSequence(
      withTiming(1.4, { duration: 110 }),
      withSpring(1, { damping: 6, stiffness: 220 })
    );
    // Destello del halo
    glow.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(0, { duration: 520 })
    );
    // Estallido de 3 emojis que suben y se desvanecen
    const nuevos: Particle[] = Array.from({ length: 3 }).map(() => ({
      id: nextId.current++,
      dx: Math.round(Math.random() * 36 - 18),
    }));
    setParticles((ps) => [...ps, ...nuevos]);
  };

  return (
    <Pressable
      onPress={() => {
        burst();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Reaccionar ${emoji}`}
    >
      <View style={styles.itemWrap}>
        {particles.map((p) => (
          <FloatingEmoji
            key={p.id}
            emoji={emoji}
            dx={p.dx}
            onDone={() => removeParticle(p.id)}
          />
        ))}
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View
          style={[styles.item, selected && styles.itemSelected, animatedStyle]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

function FloatingEmoji({
  emoji,
  dx,
  onDone,
}: {
  emoji: string;
  dx: number;
  onDone: () => void;
}) {
  const t = useSharedValue(0);
  // Arranca la animación una sola vez (al montar).
  const started = useRef(false);
  if (!started.current) {
    started.current = true;
    t.value = withTiming(1, { duration: 850 }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  }

  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [
      { translateY: -64 * t.value },
      { translateX: dx * t.value },
      { scale: 0.7 + t.value * 0.6 },
    ],
  }));

  return (
    <Animated.Text style={[styles.floating, style]} pointerEvents="none">
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  itemWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  glow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.ember,
  },
  emoji: {
    fontSize: 23,
  },
  floating: {
    position: 'absolute',
    top: 0,
    fontSize: 22,
    zIndex: 2,
  },
});
