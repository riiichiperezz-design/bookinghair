import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

const BARS = [
  { height: 14, color: colors.ember, delay: 0 },
  { height: 38, color: colors.emberSoft, delay: 130 },
  { height: 54, color: colors.emberBright, delay: 280 },
  { height: 26, color: colors.emberSoft, delay: 80 },
  { height: 44, color: colors.ember, delay: 220 },
  { height: 18, color: colors.emberDeep, delay: 40 },
];

function Bar({ height, color, delay }: (typeof BARS)[number]) {
  const scale = useSharedValue(0.45);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      return;
    }
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 525, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [delay, reduced, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.bar, { height, backgroundColor: color }, animatedStyle]}
    />
  );
}

export function Waveform() {
  return (
    <View style={styles.container}>
      {BARS.map((bar, i) => (
        <Bar key={i} {...bar} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 54,
  },
  bar: {
    width: 5,
    borderRadius: 3,
  },
});
