import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EmberBackground } from '@/components/EmberBackground';
import { Waveform } from '@/components/Waveform';
import { colors } from '@/theme';

/** Pantalla de carga de marca (mientras cargan fuentes y sesión). */
export function BrandLoader() {
  return (
    <EmberBackground>
      <Animated.View style={styles.center} entering={FadeIn.duration(400)}>
        <View style={styles.wave}>
          <Waveform />
        </View>
        <Text style={styles.wordmark}>
          ECCO<Text style={styles.dot}>.</Text>
        </Text>
      </Animated.View>
    </EmberBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  wave: {
    height: 54,
    justifyContent: 'center',
  },
  wordmark: {
    // Fuentes aún pueden no estar cargadas: usamos la del sistema.
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 4,
    color: colors.textSecondary,
  },
  dot: {
    color: colors.ember,
  },
});
