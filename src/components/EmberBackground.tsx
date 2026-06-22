import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '@/theme';

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Fondo "brasa": gradiente vertical oscuro + halo cálido superior
 * que imita el radial-gradient de los mockups.
 */
export function EmberBackground({ children, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={[colors.bgTop, colors.bgMid, colors.bgBottom]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Halo cálido centrado arriba */}
      <LinearGradient
        colors={['rgba(232,96,44,0.18)', 'rgba(232,96,44,0)']}
        locations={[0, 1]}
        style={styles.glow}
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
    top: -120,
    left: '50%',
    width: 420,
    height: 420,
    marginLeft: -210,
    borderRadius: 210,
  },
});
