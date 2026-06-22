import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PauseIcon, PlayIcon } from '@/components/icons';
import { colors, fonts, radius, spacing } from '@/theme';

const BARS = [14, 24, 30, 18, 26, 12, 20, 28, 16, 22, 10, 24];
const BAR_COLORS = [
  colors.ember,
  colors.emberSoft,
  colors.emberBright,
  colors.emberSoft,
  colors.emberDeep,
];

type Props = {
  /** Duración formateada, p. ej. "0:27". */
  duration: string;
  playing: boolean;
  onTogglePlay: () => void;
};

/** Tarjeta del reproductor de voz: play + onda estática + duración. */
export function AudioPlayerCard({ duration, playing, onTogglePlay }: Props) {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={onTogglePlay}
        style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pausar voz' : 'Reproducir voz'}
      >
        {playing ? (
          <PauseIcon size={22} color="#ffffff" />
        ) : (
          <PlayIcon size={22} color="#ffffff" />
        )}
      </Pressable>

      <View style={styles.wave}>
        {BARS.map((h, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { height: h, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] },
            ]}
          />
        ))}
      </View>

      <Text style={styles.duration}>{duration}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  wave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 30,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  duration: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
