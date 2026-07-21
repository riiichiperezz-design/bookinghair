import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
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
import {
  ArrowLeftIcon,
  EqualizerIcon,
  ExternalPlayIcon,
  FlagIcon,
  CheckIcon,
  MicIcon,
  SonarIcon,
} from '@/components/icons';
import { ReactionsRow } from '@/components/ReactionsRow';
import { RetentionCard } from '@/components/RetentionCard';
import { flagFor } from '@/constants/countries';
import { haptics } from '@/lib/haptics';
import { t } from '@/lib/i18n';
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
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('voice.back')}
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

  // Reportar/bloquear con motivo y confirmación (funciona igual en web y móvil).
  const [reportState, setReportState] = useState<'closed' | 'open' | 'done'>(
    'closed'
  );
  const [alsoBlock, setAlsoBlock] = useState(true);

  const sendReport = async (reason: string) => {
    if (!voice) return;
    haptics.tap();
    player.pause();
    await reportVoice(voice.id, reason).catch(() => {});
    if (alsoBlock) await blockSender(voice.senderId).catch(() => {});
    haptics.success();
    setReportState('done');
  };

  const handleBlock = async () => {
    if (!voice) return;
    haptics.tap();
    player.pause();
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
          <GhostButton label={t('voice.invite')} onPress={inviteFriends} />
        </View>
      </View>
    );
  }

  if (status !== 'ready') {
    const copy = {
      needSend: {
        Icon: MicIcon,
        title: t('voice.needSendTitle'),
        subtitle: t('voice.needSendSub'),
      },
      error: {
        Icon: SonarIcon,
        title: t('voice.errorTitle'),
        subtitle: t('voice.errorSub'),
      },
    }[status];

    return (
      <View style={styles.flexBody}>
        <Centered>
          <copy.Icon size={44} color={colors.textMuted} />
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </Centered>
        <View style={styles.bottom}>
          <PrimaryButton
            label={t('voice.drop')}
            icon={<MicIcon size={20} color="#ffffff" />}
            onPress={() => router.replace('/record')}
          />
          <GhostButton
            label={t('record.backHome')}
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
        <Avatar
          name={username ?? '?'}
          size={92}
          uri={voice?.avatarUrl}
          badge={voice?.badge}
        />
        <Text style={styles.kicker}>{t('voice.kicker')}</Text>
        <Text style={styles.title}>
          {username ? t('voice.titleUser', { u: username }) : t('voice.titleAnon')}
        </Text>
        {voice?.country ? (
          <View style={styles.countryPill}>
            <Text style={styles.countryText}>
              {t('voice.from', { c: voice.country })} {flagFor(voice.country)}
            </Text>
          </View>
        ) : (
          <View style={styles.countryPill}>
            <Text style={styles.countryText}>{t('voice.noPlace')}</Text>
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
        {voice?.song && (
          <Pressable
            onPress={() => {
              haptics.tap();
              if (voice.song?.url) Linking.openURL(voice.song.url).catch(() => {});
            }}
            style={({ pressed }) => [styles.songCard, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${t('voice.listen')} · ${voice.song.title}`}
          >
            <View style={styles.songHeader}>
              <EqualizerIcon size={13} color={colors.emberBright} />
              <Text style={styles.songKicker}>{t('voice.songKicker')}</Text>
            </View>
            <View style={styles.songBody}>
              {voice.song.image ? (
                <Image source={{ uri: voice.song.image }} style={styles.songCover} />
              ) : (
                <View style={[styles.songCover, styles.songCoverFallback]}>
                  <EqualizerIcon size={18} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {voice.song.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {voice.song.artist}
                </Text>
              </View>
              <View style={styles.songPlay}>
                <ExternalPlayIcon size={13} color="#0d1a12" />
                <Text style={styles.songPlayText}>{t('voice.listen')}</Text>
              </View>
            </View>
          </Pressable>
        )}
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
        <View style={styles.modRow}>
          <Pressable
            onPress={() => {
              haptics.tap();
              setReportState('open');
            }}
            hitSlop={8}
            style={styles.modBtn}
            accessibilityRole="button"
            accessibilityLabel={t('voice.reportA11y')}
          >
            <FlagIcon size={13} color={colors.textMuted} />
            <Text style={styles.modText}>{t('voice.report')}</Text>
          </Pressable>
          <Text style={styles.modSep}>·</Text>
          <Pressable
            onPress={handleBlock}
            hitSlop={8}
            style={styles.modBtn}
            accessibilityRole="button"
            accessibilityLabel={t('voice.blockA11y')}
          >
            <Text style={styles.modText}>{t('voice.block')}</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Hoja de reporte con motivo (overlay propio: web + móvil) */}
      {reportState !== 'closed' && (
        <View style={styles.sheetOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill as object}
            onPress={() => reportState === 'open' && setReportState('closed')}
            accessibilityLabel={t('song.close')}
          />
          <Animated.View style={styles.sheet} entering={FadeInDown.duration(220)}>
            {reportState === 'open' ? (
              <>
                <Text style={styles.sheetTitle}>{t('voice.sheetTitle')}</Text>
                <Text style={styles.sheetSub}>{t('voice.sheetSub')}</Text>
                {[
                  ['contenido_sexual', t('voice.r1')],
                  ['odio_acoso', t('voice.r2')],
                  ['spam_estafa', t('voice.r3')],
                  ['otro', t('voice.r4')],
                ].map(([key, label]) => (
                  <Pressable
                    key={key}
                    onPress={() => sendReport(key)}
                    style={({ pressed }) => [
                      styles.sheetOption,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.sheetOptionText}>{label}</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setAlsoBlock((v) => !v)}
                  style={styles.sheetBlockRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: alsoBlock }}
                >
                  <View style={[styles.sheetCheck, alsoBlock && styles.sheetCheckOn]}>
                    {alsoBlock && <CheckIcon size={13} color={colors.textOnEmber} />}
                  </View>
                  <Text style={styles.sheetBlockText}>{t('voice.alsoBlock')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.sheetTitle}>{t('voice.thanksTitle')}</Text>
                <Text style={styles.sheetSub}>
                  {alsoBlock ? t('voice.thanksBlock') : t('voice.thanks')}
                </Text>
                <PrimaryButton
                  label={t('voice.home')}
                  onPress={() => router.replace('/')}
                />
              </>
            )}
          </Animated.View>
        </View>
      )}
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
  songCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  songHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  songKicker: {
    fontFamily: fonts.labelBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  songBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  songCover: { width: 46, height: 46, borderRadius: 8 },
  songCoverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  songInfo: { flex: 1 },
  songTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14.5,
    color: colors.textPrimary,
  },
  songArtist: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  songPlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1DB954',
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
  },
  songPlayText: {
    fontFamily: fonts.labelBold,
    fontSize: 12,
    color: '#0d1a12',
  },
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,4,2,0.72)',
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: 21,
    letterSpacing: -0.6,
    color: colors.textPrimary,
  },
  sheetSub: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sheetOption: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sheetOptionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sheetBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sheetCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCheckOn: {
    backgroundColor: colors.ember,
    borderColor: colors.ember,
  },
  sheetBlockText: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  bottom: {
    paddingBottom: spacing.xl,
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
});
