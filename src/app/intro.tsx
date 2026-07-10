import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/buttons';
import { EmberBackground } from '@/components/EmberBackground';
import { t } from '@/lib/i18n';
import { enableDailyReminder } from '@/lib/notifications';
import { colors, fonts, radius, spacing } from '@/theme';

const STEPS = [
  { emoji: '🎙️', title: t('intro.s1t'), text: t('intro.s1x') },
  { emoji: '🌍', title: t('intro.s2t'), text: t('intro.s2x') },
  { emoji: '🔥', title: t('intro.s3t'), text: t('intro.s3x') },
  { emoji: '🎧', title: t('intro.s4t'), text: t('intro.s4x') },
];

export default function IntroScreen() {
  const router = useRouter();
  return (
    <EmberBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.wordmark}>
            ECCO<Text style={styles.wordmarkDot}>.</Text>
          </Text>
          <Text style={styles.title}>{t('intro.how')}</Text>

          <View style={styles.steps}>
            {STEPS.map((s) => (
              <View key={s.title} style={styles.step}>
                <View style={styles.stepIcon}>
                  <Text style={styles.stepEmoji}>{s.emoji}</Text>
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepText}>{s.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={t('intro.start')}
            onPress={async () => {
              // Prime de permiso con contexto: avisos para no perder la racha.
              await enableDailyReminder();
              router.replace('/');
            }}
          />
        </View>
      </SafeAreaView>
    </EmberBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: fonts.labelBold,
    fontSize: 13,
    letterSpacing: 3,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  wordmarkDot: { color: colors.ember },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: -1.2,
    color: colors.textPrimary,
    marginBottom: spacing.xxl,
  },
  steps: {
    gap: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  stepIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepEmoji: { fontSize: 24 },
  stepBody: { flex: 1 },
  stepTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepText: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  footer: {
    paddingBottom: spacing.xl,
  },
});
