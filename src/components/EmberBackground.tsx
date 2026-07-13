import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle;
};

const AGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * Fondo "brasa": gradiente vertical oscuro + halo cálido superior que respira
 * lentamente, y un rescoldo inferior para dar profundidad.
 */
export function EmberBackground({ children, style }: Props) {
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [breath]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + breath.value * 0.4,
    transform: [{ scale: 0.94 + breath.value * 0.12 }],
  }));

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={[colors.bgTop, colors.bgMid, colors.bgBottom]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Halo cálido centrado arriba, respirando */}
      <AGradient
        colors={['rgba(255,122,61,0.22)', 'rgba(232,96,44,0)']}
        locations={[0, 1]}
        style={[styles.glow, glowStyle]}
        pointerEvents="none"
      />
      {/* Rescoldo inferior tenue */}
      <LinearGradient
        colors={['rgba(232,96,44,0)', 'rgba(201,90,42,0.10)']}
        locations={[0, 1]}
        style={styles.emberBottom}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBottom,
  },
  glow: {
    position: 'absolute',
    top: -140,
    left: '50%',
    width: 460,
    height: 460,
    marginLeft: -230,
    borderRadius: 230,
  },
  emberBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 240,
  },
});
