import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
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

/**
 * Reacciones con física: squash & stretch, giro, anillo expansivo y un
 * estallido de emojis que salen disparados con trayectorias aleatorias.
 */
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

type Particle = {
  id: number;
  dx: number;
  dy: number;
  rot: number;
  size: number;
  dur: number;
  delay: number;
};

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
  const rotate = useSharedValue(0);
  const ring = useSharedValue(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);

  const removeParticle = useCallback((id: number) => {
    setParticles((ps) => ps.filter((p) => p.id !== id));
  }, []);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value === 0 ? 0 : 0.75 * (1 - ring.value),
    transform: [{ scale: 0.6 + ring.value * 1.8 }],
  }));

  const burst = () => {
    // Squash & stretch con rebote
    scale.value = withSequence(
      withTiming(0.82, { duration: 70, easing: Easing.out(Easing.quad) }),
      withSpring(1.28, { damping: 5, stiffness: 320 }),
      withSpring(1, { damping: 7, stiffness: 240 })
    );
    // Giro de celebración
    rotate.value = withSequence(
      withTiming(-14, { duration: 80 }),
      withSpring(10, { damping: 4, stiffness: 260 }),
      withSpring(0, { damping: 6, stiffness: 220 })
    );
    // Anillo expansivo
    ring.value = 0;
    ring.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) });
    // 6 emojis disparados con trayectorias aleatorias
    const nuevos: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: nextId.current++,
      dx: Math.round(Math.random() * 76 - 38),
      dy: 66 + Math.round(Math.random() * 52),
      rot: Math.round(Math.random() * 72 - 36),
      size: 15 + Math.round(Math.random() * 11),
      dur: 700 + Math.round(Math.random() * 320),
      delay: i * 34,
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
            particle={p}
            onDone={() => removeParticle(p.id)}
          />
        ))}
        <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />
        <Animated.View
          style={[styles.item, selected && styles.itemSelected, btnStyle]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

function FloatingEmoji({
  emoji,
  particle,
  onDone,
}: {
  emoji: string;
  particle: Particle;
  onDone: () => void;
}) {
  const t = useSharedValue(0);
  const started = useRef(false);
  if (!started.current) {
    started.current = true;
    t.value = withDelay(
      particle.delay,
      withTiming(
        1,
        { duration: particle.dur, easing: Easing.out(Easing.quad) },
        (finished) => {
          if (finished) runOnJS(onDone)();
        }
      )
    );
  }

  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.15 ? t.value / 0.15 : 1 - (t.value - 0.15) / 0.85,
    transform: [
      { translateY: -particle.dy * t.value },
      // Deriva lateral con curva (parece que "flota", no que sube recto)
      { translateX: particle.dx * t.value * t.value },
      { rotate: `${particle.rot * t.value}deg` },
      { scale: 0.5 + t.value * 0.9 },
    ],
  }));

  return (
    <Animated.Text
      style={[styles.floating, { fontSize: particle.size }, style]}
      pointerEvents="none"
    >
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSelected: {
    borderWidth: 1.5,
    borderColor: colors.emberBright,
    backgroundColor: colors.surfaceElevated,
    shadowColor: colors.ember,
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  ring: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.emberBright,
  },
  emoji: {
    fontSize: 24,
  },
  floating: {
    position: 'absolute',
    top: 2,
    zIndex: 2,
  },
});
