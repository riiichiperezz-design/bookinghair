import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GhostButton, PrimaryButton } from '@/components/buttons';
import { EmberBackground } from '@/components/EmberBackground';
import { InboxIcon } from '@/components/icons';
import { Waveform } from '@/components/Waveform';
import { colors, fonts, spacing } from '@/theme';

export default function Home() {
  return (
    <EmberBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Wordmark */}
          <Text style={styles.wordmark}>
            ECCO<Text style={styles.wordmarkDot}>.</Text>
          </Text>

          {/* Onda de audio */}
          <View style={styles.waveWrap}>
            <Waveform />
          </View>

          {/* Titular */}
          <Text style={styles.title}>Alguien te ha mandado algo</Text>
          <Text style={styles.subtitle}>No sabes quién. Solo le das al play.</Text>
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <PrimaryButton
            label="Abrir mis voces"
            icon={<InboxIcon size={20} color="#ffffff" />}
            badge={2}
          />
          <GhostButton label="soltar una voz" />
        </View>
      </SafeAreaView>
    </EmberBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: fonts.labelBold,
    fontSize: 13,
    letterSpacing: 3,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  wordmarkDot: {
    color: colors.ember,
  },
  waveWrap: {
    width: 124,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 33,
    lineHeight: 36,
    letterSpacing: -1.2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    paddingBottom: spacing.xl,
  },
});
