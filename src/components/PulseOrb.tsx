import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Waveform } from '@/components/Waveform';
import { colors } from '@/theme';

const SIZE = 150;
const CORE = 96;

/** Anillo que se expande y se desvanece en bucle (efecto "sonar"). */
function Ring({ delay }: { delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2600, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
  }, [t, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - t.value) * 0.5,
    transform: [{ scale: 0.5 + t.value * 0.9 }],
  }));

  return <Animated.View style={[styles.ring, style]} pointerEvents="none" />;
}

/**
 * Orbe brasa del hero: núcleo con brillo que respira, anillos que laten y la
 * onda de audio dentro. Da la sensación de "algo vivo esperándote".
 */
export function PulseOrb() {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [glow]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.97 + glow.value * 0.06 }],
    shadowOpacity: 0.4 + glow.value * 0.4,
  }));

  return (
    <View style={styles.wrap}>
      <Ring delay={0} />
      <Ring delay={870} />
      <Ring delay={1740} />
      <Animated.View style={[styles.core, coreStyle]}>
        <Waveform />
      </Animated.View>
    </View>
  );
}

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
    borderWidth: 1.5,
    borderColor: colors.emberBright,
  },
  core: {
    width: CORE,
    height: CORE,
    borderRadius: CORE / 2,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,122,61,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.emberBright,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
});
