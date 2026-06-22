import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlayerCard } from '@/components/AudioPlayerCard';
import { Avatar } from '@/components/Avatar';
import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon, LockIcon, MicIcon } from '@/components/icons';
import { ReactionsRow } from '@/components/ReactionsRow';
import { colors, fonts, radius, spacing } from '@/theme';

// Datos de ejemplo hasta conectar Supabase.
const MOCK_VOICE = {
  username: '@lucia_qto',
  country: 'Ecuador',
  flag: '🇪🇨',
  duration: '0:27',
};

export default function VoiceScreen() {
  const router = useRouter();
  const [playing, setPlaying] = useState(false);

  return (
    <EmberBackground>
      <SafeAreaView style={styles.safe}>
        {/* Cabecera */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <ArrowLeftIcon size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Revelado del remitente */}
        <View style={styles.reveal}>
          <Avatar name={MOCK_VOICE.username} size={92} />
          <Text style={styles.kicker}>una voz acaba de llegar</Text>
          <Text style={styles.title}>
            {MOCK_VOICE.username} tiene algo que decirte
          </Text>
          <View style={styles.countryPill}>
            <Text style={styles.countryText}>
              desde {MOCK_VOICE.country} {MOCK_VOICE.flag}
            </Text>
          </View>
        </View>

        {/* Reproductor */}
        <View style={styles.playerWrap}>
          <AudioPlayerCard
            duration={MOCK_VOICE.duration}
            playing={playing}
            onTogglePlay={() => setPlaying((p) => !p)}
          />
        </View>

        {/* Reacciones + responder */}
        <View style={styles.footer}>
          <ReactionsRow />
          <Pressable
            style={({ pressed }) => [styles.reply, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Contestarle (bloqueado)"
          >
            <MicIcon size={18} color={colors.emberBright} />
            <Text style={styles.replyText}>Contestarle</Text>
            <LockIcon size={13} color={colors.emberBright} />
          </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  reveal: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  kicker: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 27,
    letterSpacing: -0.8,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  countryPill: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.lg,
  },
  countryText: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    color: '#e8a06b',
  },
  playerWrap: {
    paddingTop: spacing.xxl,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  reply: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ember,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  replyText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#FF9460',
  },
  pressed: {
    opacity: 0.8,
  },
});
