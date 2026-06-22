import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GhostButton, PrimaryButton } from '@/components/buttons';
import { EmberBackground } from '@/components/EmberBackground';
import { InboxIcon } from '@/components/icons';
import { Waveform } from '@/components/Waveform';
import { getMyProfile } from '@/lib/profile';
import { getCredits, receivedCount } from '@/lib/voices';
import { colors, fonts, radius, spacing } from '@/theme';

export default function Home() {
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [received, setReceived] = useState(0);
  const [username, setUsername] = useState<string | null>(null);

  // Al recuperar el foco: si no hay perfil, manda a /setup; si sí, actualiza
  // los créditos (voces que puedes abrir).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const profile = await getMyProfile();
          if (!active) return;
          if (!profile?.username) {
            router.replace('/setup');
            return;
          }
          setUsername(profile.username);
          const [n, r] = await Promise.all([getCredits(), receivedCount()]);
          if (active) {
            setCredits(Math.max(0, n));
            setReceived(r);
          }
        } catch {
          // sin red / backend sin configurar: dejamos la home como está
        }
      })();
      return () => {
        active = false;
      };
    }, [router])
  );

  return (
    <EmberBackground>
      <SafeAreaView style={styles.safe}>
        {/* Barra superior: @usuario → editar perfil */}
        <View style={styles.topBar}>
          {username && (
            <Pressable
              onPress={() => router.push('/profile')}
              hitSlop={8}
              style={({ pressed }) => [styles.userChip, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Editar perfil"
            >
              <Text style={styles.userChipText}>@{username}</Text>
            </Pressable>
          )}
        </View>

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
            badge={credits}
            onPress={() => router.push('/voice')}
          />
          <GhostButton
            label="soltar una voz"
            onPress={() => router.push('/record')}
          />
          {received > 0 && (
            <Pressable
              onPress={() => router.push('/received')}
              hitSlop={8}
              style={({ pressed }) => [
                styles.receivedLink,
                pressed && styles.receivedLinkPressed,
              ]}
            >
              <Text style={styles.receivedText}>
                ver tus voces ({received})
              </Text>
            </Pressable>
          )}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 36,
    paddingTop: spacing.sm,
  },
  userChip: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  userChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.6,
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
  receivedLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  receivedLinkPressed: {
    opacity: 0.6,
  },
  receivedText: {
    fontFamily: fonts.label,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
