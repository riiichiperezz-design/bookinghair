import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { GhostButton } from '@/components/buttons';
import { haptics } from '@/lib/haptics';
import { t } from '@/lib/i18n';
import { enableDailyReminder } from '@/lib/notifications';
import { getStreakCount } from '@/lib/streak';
import { colors, fonts, radius, spacing } from '@/theme';

/**
 * Horas hasta la próxima medianoche UTC: es cuando el servidor resetea el
 * ritual diario (1 voz enviada / 1 recibida), así la cuenta atrás es real.
 */
function hoursToMidnight(): number {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return Math.max(1, Math.round((next - now.getTime()) / 3_600_000));
}

/**
 * Momento de retención: aparece cuando ya has escuchado todo por hoy. Refuerza
 * la racha y ofrece activar el aviso para volver mañana.
 */
export function RetentionCard() {
  const [streak, setStreak] = useState(0);
  const [reminder, setReminder] = useState<'idle' | 'on' | 'unavailable'>(
    'idle'
  );
  const horas = hoursToMidnight();

  useEffect(() => {
    getStreakCount().then(setStreak).catch(() => {});
  }, []);

  const activar = async () => {
    haptics.tap();
    const ok = await enableDailyReminder();
    if (ok) {
      haptics.success();
      setReminder('on');
    } else {
      setReminder(Platform.OS === 'web' ? 'unavailable' : 'idle');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.Text style={styles.flame} entering={ZoomIn.duration(420)}>
        🔥
      </Animated.Text>

      {streak > 0 && (
        <Animated.View
          style={styles.streakPill}
          entering={FadeInDown.duration(380)}
        >
          <Text style={styles.streakText}>{t('ret.streak', { n: streak })}</Text>
        </Animated.View>
      )}

      <Animated.Text
        style={styles.title}
        entering={FadeInDown.duration(420).delay(80)}
      >
        {t('ret.title')}
      </Animated.Text>
      <Animated.Text
        style={styles.subtitle}
        entering={FadeInDown.duration(420).delay(160)}
      >
        {t('ret.subtitle')}
      </Animated.Text>

      <Animated.View
        style={styles.nextRow}
        entering={FadeInDown.duration(420).delay(240)}
      >
        <Text style={styles.nextText}>{t('ret.back', { n: horas })}</Text>
      </Animated.View>

      <View style={styles.cta}>
        {reminder === 'on' ? (
          <Text style={styles.reminderOn}>{t('ret.remindOn')}</Text>
        ) : reminder === 'unavailable' ? (
          <Text style={styles.reminderOn}>{t('ret.remindWeb')}</Text>
        ) : (
          <GhostButton label={t('ret.remindCta')} onPress={activar} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  flame: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  streakPill: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ember,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  streakText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 29,
    letterSpacing: -0.8,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  nextRow: {
    marginTop: spacing.lg,
  },
  nextText: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    color: colors.textMuted,
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: spacing.xxl,
  },
  reminderOn: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.emberBright,
    textAlign: 'center',
  },
});
