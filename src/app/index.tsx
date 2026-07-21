import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GhostButton, PrimaryButton } from '@/components/buttons';
import { EmberBackground } from '@/components/EmberBackground';
import { BellIcon, FlameIcon, InboxIcon } from '@/components/icons';
import {
  isStreakMilestone,
  StreakCelebration,
} from '@/components/StreakCelebration';
import { PulseOrb } from '@/components/PulseOrb';
import { getNewActivityCount } from '@/lib/activity';
import { track } from '@/lib/analytics';
import { haptics } from '@/lib/haptics';
import { t } from '@/lib/i18n';
import { logError } from '@/lib/log';
import { getMyProfile } from '@/lib/profile';
import { registerPushToken } from '@/lib/push';
import { touchStreak } from '@/lib/streak';
import {
  getCredits,
  receivedCount,
  remoderarPendientes,
  waitingCount,
} from '@/lib/voices';
import { colors, fonts, radius, spacing } from '@/theme';

export default function Home() {
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [received, setReceived] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [activity, setActivity] = useState(0);
  const [waiting, setWaiting] = useState(0);
  const [celebrate, setCelebrate] = useState<number | null>(null);

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
          track('app_open');
          registerPushToken().catch(() => {});
          // Red de seguridad: reintenta moderar tus voces que se hayan
          // quedado 'pendiente' (p. ej. si falló la invocación inicial).
          remoderarPendientes().catch(() => {});
          const [n, r, s, a, w] = await Promise.all([
            getCredits(),
            receivedCount(),
            touchStreak(),
            getNewActivityCount(),
            waitingCount(),
          ]);
          if (active) {
            setCredits(Math.max(0, n));
            setReceived(r);
            setStreak(s.count);
            setActivity(a);
            setWaiting(w);
            if (s.isNewDay && isStreakMilestone(s.count)) {
              haptics.success();
              setCelebrate(s.count);
            }
          }
        } catch (e) {
          // sin red / backend sin configurar: dejamos la home como está
          logError('home.load', e);
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
        {/* Barra superior: racha · @usuario */}
        <View style={styles.topBar}>
          {streak > 0 ? (
            <View style={styles.streakChip}>
              <FlameIcon size={14} color={colors.emberBright} />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.topRight}>
            <Pressable
              onPress={() => router.push('/activity')}
              hitSlop={8}
              style={({ pressed }) => [styles.bellBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('home.news')}
            >
              <BellIcon size={20} color={colors.textPrimary} />
              {activity > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {activity > 9 ? '9+' : activity}
                  </Text>
                </View>
              )}
            </Pressable>
            {username && (
              <Pressable
                onPress={() => router.push('/profile')}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.userChip,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('home.editProfile')}
              >
                <Text style={styles.userChipText}>@{username}</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {/* Wordmark */}
          <Text style={styles.wordmark}>
            ECCO<Text style={styles.wordmarkDot}>.</Text>
          </Text>

          {/* Orbe brasa vivo */}
          <View style={styles.orbWrap}>
            <PulseOrb />
          </View>

          {/* Titular */}
          <Text style={styles.title}>{t('home.title')}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
          {waiting > 0 && (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{t('home.waiting', { n: waiting })}</Text>
            </View>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <PrimaryButton
            label={t('home.open')}
            icon={<InboxIcon size={20} color="#ffffff" />}
            badge={credits}
            onPress={() => router.push('/voice')}
          />
          <GhostButton
            label={t('home.record')}
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
                {t('home.seeYours', { n: received })}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      {celebrate != null && (
        <StreakCelebration
          count={celebrate}
          onClose={() => setCelebrate(null)}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
    paddingTop: spacing.sm,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  streakText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bellBtn: {
    padding: 4,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontFamily: fonts.labelBold,
    fontSize: 9,
    color: '#ffffff',
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
  orbWrap: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 37,
    lineHeight: 39,
    letterSpacing: -1.6,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.labelRegular,
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  liveText: {
    fontFamily: fonts.label,
    fontSize: 12,
    color: colors.textSecondary,
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
