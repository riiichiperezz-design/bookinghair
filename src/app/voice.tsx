import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlayerCard } from '@/components/AudioPlayerCard';
import { Avatar } from '@/components/Avatar';
import { GhostButton, PrimaryButton } from '@/components/buttons';
import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon, LockIcon, MicIcon } from '@/components/icons';
import { ReactionsRow } from '@/components/ReactionsRow';
import { addReaction, fetchNextVoice, markViewed, type Voice } from '@/lib/voices';
import { colors, fonts, radius, spacing } from '@/theme';

function formatMs(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VoiceScreen() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <EmberBackground>
      <SafeAreaView style={styles.safe}>
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
        {mounted ? <VoiceInner /> : <Centered><Spinner /></Centered>}
      </SafeAreaView>
    </EmberBackground>
  );
}

type Status = 'loading' | 'ready' | 'empty' | 'error';

function VoiceInner() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [voice, setVoice] = useState<Voice | null>(null);
  const [playing, setPlaying] = useState(false);

  const player = useAudioPlayer(voice?.audioUrl ?? undefined);

  useEffect(() => {
    let active = true;
    fetchNextVoice()
      .then((v) => {
        if (!active) return;
        if (v) {
          setVoice(v);
          setStatus('ready');
          markViewed(v.id).catch(() => {});
        } else {
          setStatus('empty');
        }
      })
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, []);

  const togglePlay = () => {
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.seekTo(0);
      player.play();
      setPlaying(true);
    }
  };

  if (status === 'loading') {
    return (
      <Centered>
        <Spinner />
      </Centered>
    );
  }

  if (status === 'empty' || status === 'error') {
    return (
      <View style={styles.flexBody}>
        <Centered>
          <Text style={styles.bigEmoji}>{status === 'error' ? '😕' : '🌙'}</Text>
          <Text style={styles.title}>
            {status === 'error'
              ? 'Algo salió mal'
              : 'No tienes voces nuevas'}
          </Text>
          <Text style={styles.subtitle}>
            {status === 'error'
              ? 'Revisa tu conexión e inténtalo otra vez.'
              : 'Suelta una voz y espera a que alguien te conteste.'}
          </Text>
        </Centered>
        <View style={styles.bottom}>
          <PrimaryButton
            label="Soltar una voz"
            icon={<MicIcon size={20} color="#ffffff" />}
            onPress={() => router.replace('/record')}
          />
          <GhostButton label="volver al inicio" onPress={() => router.replace('/')} />
        </View>
      </View>
    );
  }

  // status === 'ready'
  return (
    <View style={styles.flexBody}>
      <View style={styles.reveal}>
        <Avatar name="?" size={92} />
        <Text style={styles.kicker}>una voz acaba de llegar</Text>
        <Text style={styles.title}>Alguien tiene algo que decirte</Text>
        {voice?.country ? (
          <View style={styles.countryPill}>
            <Text style={styles.countryText}>desde {voice.country}</Text>
          </View>
        ) : (
          <View style={styles.countryPill}>
            <Text style={styles.countryText}>anónima · sin nombre</Text>
          </View>
        )}
      </View>

      <View style={styles.playerWrap}>
        <AudioPlayerCard
          duration={formatMs(voice?.duration_ms ?? 0)}
          playing={playing}
          onTogglePlay={togglePlay}
        />
      </View>

      <View style={styles.footer}>
        <ReactionsRow
          onReact={(emoji) => {
            if (voice) addReaction(voice.id, emoji).catch(() => {});
          }}
        />
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
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

function Spinner() {
  return <ActivityIndicator color={colors.ember} size="large" />;
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
  flexBody: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  subtitle: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
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
  bottom: {
    paddingBottom: spacing.xl,
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
  bigEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
});
