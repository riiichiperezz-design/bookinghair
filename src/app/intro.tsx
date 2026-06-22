import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/buttons';
import { EmberBackground } from '@/components/EmberBackground';
import { colors, fonts, radius, spacing } from '@/theme';

const STEPS = [
  {
    emoji: '🎙️',
    title: 'Suelta una voz',
    text: 'Graba un audio y lánzalo al mundo, sin decir quién eres.',
  },
  {
    emoji: '🎁',
    title: 'Das para recibir',
    text: 'Por cada voz que mandas, te llega la de un total desconocido.',
  },
  {
    emoji: '🔥',
    title: 'Única, para ti',
    text: 'Cada audio se entrega a una sola persona. Reacciona con un emoji.',
  },
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
          <Text style={styles.title}>Así funciona</Text>

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
          <PrimaryButton label="Empezar" onPress={() => router.replace('/')} />
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
