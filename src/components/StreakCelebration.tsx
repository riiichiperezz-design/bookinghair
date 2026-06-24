import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/buttons';
import { colors, fonts, spacing } from '@/theme';

const MILESTONES = new Set([3, 7, 14, 30, 50, 75, 100, 200, 365]);

export function isStreakMilestone(count: number): boolean {
  return MILESTONES.has(count);
}

type Props = {
  count: number;
  onClose: () => void;
};

/** Overlay celebratorio al alcanzar un hito de racha. */
export function StreakCelebration({ count, onClose }: Props) {
  return (
    <Animated.View
      style={styles.backdrop}
      entering={FadeIn.duration(250)}
      pointerEvents="auto"
    >
      <Animated.View entering={ZoomIn.duration(420)} style={styles.card}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.title}>¡{count} días de racha!</Text>
        <Text style={styles.subtitle}>
          No rompas la cadena. El mundo quiere seguir oyéndote.
        </Text>
        <View style={styles.action}>
          <PrimaryButton label="¡Seguir!" onPress={onClose} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,4,2,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 100,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ember,
    borderRadius: 28,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  flame: {
    fontSize: 64,
  },
  count: {
    fontFamily: fonts.display,
    fontSize: 56,
    color: colors.emberBright,
    marginTop: -spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.8,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  action: {
    alignSelf: 'stretch',
  },
});
