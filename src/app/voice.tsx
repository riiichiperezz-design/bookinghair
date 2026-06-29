import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlayerCard } from '@/components/AudioPlayerCard';
import { Avatar } from '@/components/Avatar';
import { GhostButton, PrimaryButton } from '@/components/buttons';
import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon, FlagIcon, LockIcon, MicIcon } from '@/components/icons';
import { ReactionsRow } from '@/components/ReactionsRow';
import { RetentionCard } from '@/components/RetentionCard';
import { flagFor } from '@/constants/countries';
import { haptics } from '@/lib/haptics';
import { blockSender, reportVoice } from '@/lib/moderation';
import { inviteFriends } from '@/lib/share';
import {
  addReaction,
  claimVoice,
  getCredits,
  markVoiceHeard,
  type Voice,
} from '@/lib/voices';
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

type Status = 'loading' | 'ready' | 'empty' | 'needSend' | 'error';

function VoiceInner() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [voice, setVoice] = useState<Voice | null>(null);
  const [heardMarked, setHeardMarked] = useState(false);

  const player = useAudioPlayer(voice?.audioUrl ?? undefined);
  const playerStatus = useAudioPlayerStatus(player);
  const playing = playerStatus.playing;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const credits = await getCredits();
        if (!active) return;
        if (credits <= 0) {
          setStatus('needSend');
          return;
        }
        const v = await claimVoice();
        if (!active) return;
        if (v) {
          setVoice(v);
          setStatus('ready');
          haptics.impact();
        } else {
          setStatus('empty');
        }
      } catch {
        if (active) setStatus('error');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const togglePlay = () => {
    if (playing) {
      player.pause();
    } else {
      if (playerStatus.didJustFinish) player.seekTo(0);
      player.play();
      // Escucha única: en cuanto se reproduce, queda marcada como oída y no
      // podrá volver a abrirse desde "tus voces".
      if (voice && !heardMarked) {
        setHeardMarked(true);
        markVoiceHeard(voice.id).catch(() => {});
      }
    }
  };

  const handleReport = async () => {
    if (!voice) return;
    haptics.tap();
    await reportVoice(voice.id).catch(() => {});
    router.replace('/');
  };

  const handleBlock = async () => {
    if (!voice) return;
    haptics.tap();
    await blockSender(voice.senderId).catch(() => {});
    router.replace('/');
  };

  if (status === 'loading') {
    return (
      <Centered>
        <Spinner />
      </Centered>
    );
  }

  // Ya escuchó todo lo disponible: momento de retención (vuelve mañana).
  if (status === 'empty') {
    return (
      <View style={styles.flexBody}>
        <RetentionCard />
        <View style={styles.bottom}>
          <GhostButton label="Invitar a amigos" onPress={inviteFriends} />
        </View>
      </View>
    );
  }

  if (status !== 'ready') {
    const copy = {
      needSend: {
        emoji: '🎙️',
        title: 'Manda una voz para recibir',
        subtitle:
          'En ecco das para recibir: suelta un audio al mundo y te llegará el de un desconocido.',
      },
      error: {
        emoji: '😕',
        title: 'Algo salió mal',
        subtitle: 'Revisa tu conexión e inténtalo otra vez.',
      },
    }[status];

    return (
      <View style={styles.flexBody}>
        <Centered>
          <Text style={styles.bigEmoji}>{copy.emoji}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </Centered>
        <View style={styles.bottom}>
          <PrimaryButton
            label="Soltar una voz"
            icon={<MicIcon size={20} color="#ffffff" />}
            onPress={() => router.replace('/record')}
          />
          <GhostButton
            label="volver al inicio"
            onPress={() => router.replace('/')}
          />
        </View>
      </View>
    );
  }

  // status === 'ready'
  const username = voice?.username ?? null;
  return (
    <View style={styles.flexBody}>
      <Animated.View style={styles.reveal} entering={FadeInDown.duration(450)}>
        <Avatar name={username ?? '?'} size={92} />
        <Text style={styles.kicker}>una voz acaba de llegar</Text>
        <Text style={styles.title}>
          {username ? `@${username} tiene algo que decirte` : 'Alguien tiene algo que decirte'}
        </Text>
        {voice?.country ? (
          <View style={styles.countryPill}>
            <Text style={styles.countryText}>
              desde {voice.country} {flagFor(voice.country)}
            </Text>
          </View>
        ) : (
          <View style={styles.countryPill}>
            <Text style={styles.countryText}>anónima · sin lugar</Text>
          </View>
        )}
      </Animated.View>

      <Animated.View
        style={styles.playerWrap}
        entering={FadeInDown.duration(450).delay(120)}
      >
        <AudioPlayerCard
          duration={formatMs(voice?.duration_ms ?? 0)}
          playing={playing}
          onTogglePlay={togglePlay}
        />
      </Animated.View>

      <Animated.View
        style={styles.footer}
        entering={FadeInDown.duration(450).delay(220)}
      >
        <ReactionsRow
          onReact={(emoji) => {
            if (voice) addReaction(voice.id, emoji).catch(() => {});
          }}
        />
        <Pressable
          onPress={() =>
            Alert.alert(
              'Contestar es premium',
              'Responder con tu voz será una función de pago que llegará pronto. Por ahora, reacciona con un emoji.'
            )
          }
          style={({ pressed }) => [styles.reply, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Contestarle (premium, próximamente)"
        >
          <MicIcon size={18} color={colors.emberBright} />
          <Text style={styles.replyText}>Contestarle</Text>
          <View style={styles.premiumTag}>
            <LockIcon size={11} color={colors.textOnEmber} />
            <Text style={styles.premiumText}>premium</Text>
          </View>
        </Pressable>

        <View style={styles.modRow}>
          <Pressable
            onPress={handleReport}
            hitSlop={8}
            style={styles.modBtn}
            accessibilityRole="button"
            accessibilityLabel="Reportar voz"
          >
            <FlagIcon size={13} color={colors.textMuted} />
            <Text style={styles.modText}>reportar</Text>
          </Pressable>
          <Text style={styles.modSep}>·</Text>
          <Pressable
            onPress={handleBlock}
            hitSlop={8}
            style={styles.modBtn}
            accessibilityRole="button"
            accessibilityLabel="Bloquear a esta persona"
          >
            <Text style={styles.modText}>bloquear</Text>
          </Pressable>
        </View>
      </Animated.View>
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
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.ember,
    borderRadius: radius.pill,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  premiumText: {
    fontFamily: fonts.labelBold,
    fontSize: 9,
    letterSpacing: 0.5,
    color: colors.textOnEmber,
    textTransform: 'uppercase',
  },
  modRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modText: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  modSep: {
    color: colors.textMuted,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  bigEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
});
