import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

type Props = {
  recording: boolean;
  onPress: () => void;
};

/** Botón circular grande: micrófono cuando está parado, stop mientras graba. */
export function RecordButton({ recording, onPress }: Props) {
  const pulse = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (recording && !reduced) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1300, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    } else {
      pulse.value = 0;
    }
  }, [recording, reduced, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.9 + pulse.value * 0.55 }],
    opacity: 0.5 * (1 - pulse.value),
  }));

  return (
    <View style={styles.wrap}>
      {recording && <Animated.View style={[styles.ring, ringStyle]} />}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Detener grabación' : 'Grabar voz'}
      >
        {recording ? (
          <Svg width={34} height={34} viewBox="0 0 24 24" fill="#ffffff">
            <Rect x={6} y={6} width={12} height={12} rx={3} />
          </Svg>
        ) : (
          <Svg width={38} height={38} viewBox="0 0 24 24" fill="none">
            <Rect
              x={9}
              y={2}
              width={6}
              height={12}
              rx={3}
              stroke="#ffffff"
              strokeWidth={2}
            />
            <Path
              d="M5 11a7 7 0 0 0 14 0M12 18v3"
              stroke="#ffffff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </Pressable>
    </View>
  );
}

const SIZE = 96;

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.ember,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
