import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlayerCard } from '@/components/AudioPlayerCard';
import { GhostButton, PrimaryButton } from '@/components/buttons';
import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon, FlameIcon, GlobeIcon, InboxIcon } from '@/components/icons';
import { RecordButton } from '@/components/RecordButton';
import { SongPicker } from '@/components/SongPicker';
import { hoursToUtcMidnight } from '@/lib/day';
import { haptics } from '@/lib/haptics';
import { t } from '@/lib/i18n';
import { enableDailyReminder } from '@/lib/notifications';
import { inviteFriends } from '@/lib/share';
import type { Song } from '@/lib/spotify';
import { sentToday, uploadVoice } from '@/lib/voices';
import { colors, fonts, radius, spacing } from '@/theme';

const MAX_MS = 30_000; // duración máxima de una voz
const MIN_MS = 1_000; // duración mínima para poder enviar

function formatMs(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function RecordScreen() {
  const router = useRouter();
  // Los hooks de expo-audio dependen del módulo nativo / MediaRecorder, que no
  // existe en el render estático (servidor). Montamos el grabador solo en
  // cliente y mostramos un placeholder con contenido mientras tanto.
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
            accessibilityLabel="Volver"
          >
            <ArrowLeftIcon size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {mounted ? <Recorder /> : <IdleBody recording={false} timer="0:00" />}
      </SafeAreaView>
    </EmberBackground>
  );
}

/** Cuerpo de la pantalla en estado "listo para grabar / grabando". */
function IdleBody({
  recording,
  timer,
  onToggle,
}: {
  recording: boolean;
  timer: string;
  onToggle?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.kicker}>{t('record.kicker')}</Text>
      <Text style={styles.title}>{t('record.title')}</Text>
      <View style={styles.recordWrap}>
        <RecordButton recording={recording} onPress={onToggle ?? (() => {})} />
      </View>
      <Text style={styles.timer}>{timer}</Text>
      <Text style={styles.hint}>
        {recording ? t('record.stopHint') : t('record.startHint')}
      </Text>
    </View>
  );
}

/** Lógica de grabación (solo cliente). */
function Recorder() {
  const router = useRouter();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordedMs, setRecordedMs] = useState(0);
  const [song, setSong] = useState<Song | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [todayDone, setTodayDone] = useState(false);
  const [pushState, setPushState] = useState<'ask' | 'on' | 'web'>('ask');

  const askPush = async () => {
    haptics.tap();
    const ok = await enableDailyReminder();
    setPushState(ok ? 'on' : 'web');
  };

  // Ritual diario: si ya soltaste tu voz de hoy, avisa antes de grabar en vano
  // (el servidor lo bloquea igualmente al enviar).
  useEffect(() => {
    let active = true;
    sentToday()
      .then((done) => active && setTodayDone(done))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const player = useAudioPlayer(recordedUri ?? undefined);
  const playerStatus = useAudioPlayerStatus(player);
  const previewPlaying = playerStatus.playing;

  useEffect(() => {
    let active = true;
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (active && !status.granted) {
        Alert.alert(t('record.micTitle'), t('record.micBody'));
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    })();
    return () => {
      active = false;
    };
  }, []);

  const startRecording = async () => {
    setRecordedUri(null);
    haptics.impact();
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopRecording = async () => {
    haptics.impact();
    setRecordedMs(recorderState.durationMillis ?? 0);
    await recorder.stop();
    setRecordedUri(recorder.uri ?? null);
  };

  const toggleRecord = () => {
    if (recorderState.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Auto-stop al llegar al máximo (30 s).
  useEffect(() => {
    if (recorderState.isRecording && (recorderState.durationMillis ?? 0) >= MAX_MS) {
      stopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderState.durationMillis, recorderState.isRecording]);

  const togglePreview = () => {
    if (previewPlaying) {
      player.pause();
    } else {
      player.seekTo(0);
      player.play();
    }
  };

  const reRecord = () => {
    setRecordedUri(null);
    setRecordedMs(0);
    setSong(null);
  };

  const send = async () => {
    if (!recordedUri || sending) return;
    setSending(true);
    try {
      await uploadVoice(recordedUri, recordedMs, song);
      haptics.success();
      setSent(true);
    } catch (e) {
      Alert.alert(
        t('record.sendFail'),
        e instanceof Error ? e.message : t('record.tryAgain')
      );
    } finally {
      setSending(false);
    }
  };

  // Ya soltaste la de hoy (y no vienes de enviarla ahora mismo).
  if (todayDone && !sent && !recordedUri && !recorderState.isRecording) {
    const horas = hoursToUtcMidnight();
    return (
      <View style={styles.center}>
        <Animated.View style={styles.bigIcon} entering={ZoomIn.duration(420)}>
          <GlobeIcon size={44} color={colors.emberBright} />
        </Animated.View>
        <Text style={styles.title}>{t('record.doneTitle')}</Text>
        <Text style={styles.subtitle}>{t('record.doneSubtitle', { n: horas })}</Text>
        <View style={styles.sentActions}>
          <PrimaryButton
            label={t('record.openVoices')}
            icon={<InboxIcon size={20} color="#ffffff" />}
            onPress={() => router.replace('/voice')}
          />
          <GhostButton
            label={t('record.backHome')}
            onPress={() => router.replace('/')}
          />
        </View>
      </View>
    );
  }

  if (sent) {
    return (
      <View style={styles.center}>
        <Animated.View style={styles.bigIcon} entering={ZoomIn.duration(420)}>
          <FlameIcon size={44} color={colors.emberBright} />
        </Animated.View>
        <Text style={styles.title}>{t('record.sentTitle')}</Text>
        <Text style={styles.subtitle}>{t('record.sentSubtitle')}</Text>

        {/* Gancho de vuelta: activar el aviso de la voz de mañana. */}
        <View style={styles.pushCard}>
          {pushState === 'ask' ? (
            <>
              <Text style={styles.pushTitle}>{t('record.pushTitle')}</Text>
              <Text style={styles.pushBody}>{t('record.pushBody')}</Text>
              <View style={styles.pushBtns}>
                <Pressable
                  onPress={askPush}
                  style={({ pressed }) => [styles.pushYes, pressed && styles.pressedBtn]}
                >
                  <Text style={styles.pushYesText}>{t('record.pushYes')}</Text>
                </Pressable>
                <Pressable onPress={() => setPushState('web')} hitSlop={6}>
                  <Text style={styles.pushNo}>{t('record.pushNo')}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.pushDone}>
              {pushState === 'on' ? t('ret.remindOn') : t('ret.remindWeb')}
            </Text>
          )}
        </View>

        <View style={styles.sentActions}>
          <PrimaryButton
            label={t('record.home')}
            icon={<InboxIcon size={20} color="#ffffff" />}
            onPress={() => router.replace('/')}
          />
          <GhostButton label={t('record.invite')} onPress={inviteFriends} />
        </View>
      </View>
    );
  }

  const hasRecording = recordedUri != null && !recorderState.isRecording;
  const tooShort = recordedMs < MIN_MS;

  if (hasRecording) {
    return (
      <View style={styles.flexBody}>
        <View style={styles.center}>
          <Text style={styles.kicker}>{t('record.ready')}</Text>
          <Text style={styles.title}>{t('record.dropIt')}</Text>
        </View>
        <View style={styles.bottom}>
          <AudioPlayerCard
            duration={formatMs(recordedMs)}
            playing={previewPlaying}
            onTogglePlay={togglePreview}
          />
          {tooShort && (
            <Text style={styles.warn}>{t('record.tooShort')}</Text>
          )}
          <View style={styles.songWrap}>
            <SongPicker value={song} onChange={setSong} />
          </View>
          <View style={styles.spacer} />
          <PrimaryButton
            label={sending ? t('record.sending') : t('record.send')}
            icon={<InboxIcon size={20} color="#ffffff" />}
            onPress={send}
            disabled={sending || tooShort}
          />
          <GhostButton label={t('record.retry')} onPress={reRecord} />
        </View>
      </View>
    );
  }

  return (
    <IdleBody
      recording={recorderState.isRecording}
      timer={formatMs(recorderState.durationMillis ?? 0)}
      onToggle={toggleRecord}
    />
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
  flexBody: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  recordWrap: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  timer: {
    fontFamily: fonts.labelBold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  hint: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  bottom: {
    paddingBottom: spacing.xl,
  },
  songWrap: {
    marginTop: spacing.lg,
  },
  spacer: {
    height: spacing.lg,
  },
  warn: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.emberSoft,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  bigIcon: {
    marginBottom: spacing.lg,
  },
  sentActions: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
  pushCard: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ember,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  pushTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  pushBody: {
    fontFamily: fonts.labelRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  pushBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  pushYes: {
    backgroundColor: colors.ember,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
  },
  pushYesText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#ffffff',
  },
  pushNo: {
    fontFamily: fonts.label,
    fontSize: 13,
    color: colors.textMuted,
  },
  pushDone: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    color: colors.emberBright,
    textAlign: 'center',
  },
  pressedBtn: {
    opacity: 0.8,
  },
});
