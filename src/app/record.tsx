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
import { ArrowLeftIcon, InboxIcon } from '@/components/icons';
import { RecordButton } from '@/components/RecordButton';
import { haptics } from '@/lib/haptics';
import { inviteFriends } from '@/lib/share';
import { uploadVoice } from '@/lib/voices';
import { colors, fonts, spacing } from '@/theme';

const MAX_MS = 60_000; // duración máxima de una voz
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
            onPress={() => router.back()}
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
      <Text style={styles.kicker}>para alguien, sin decir quién</Text>
      <Text style={styles.title}>Suelta una voz</Text>
      <View style={styles.recordWrap}>
        <RecordButton recording={recording} onPress={onToggle ?? (() => {})} />
      </View>
      <Text style={styles.timer}>{timer}</Text>
      <Text style={styles.hint}>
        {recording ? 'toca para parar · máx 60s' : 'toca para empezar a grabar'}
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
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const player = useAudioPlayer(recordedUri ?? undefined);
  const playerStatus = useAudioPlayerStatus(player);
  const previewPlaying = playerStatus.playing;

  useEffect(() => {
    let active = true;
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (active && !status.granted) {
        Alert.alert(
          'Micrófono bloqueado',
          'Activa el permiso de micrófono para grabar tu voz.'
        );
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

  // Auto-stop al llegar al máximo (60 s).
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
  };

  const send = async () => {
    if (!recordedUri || sending) return;
    setSending(true);
    try {
      await uploadVoice(recordedUri, recordedMs);
      haptics.success();
      setSent(true);
    } catch (e) {
      Alert.alert(
        'No se pudo enviar',
        e instanceof Error ? e.message : 'Inténtalo de nuevo.'
      );
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.center}>
        <Animated.Text style={styles.bigEmoji} entering={ZoomIn.duration(420)}>
          🔥
        </Animated.Text>
        <Text style={styles.title}>Va de camino. Un segundo y sale.</Text>
        <Text style={styles.subtitle}>
          Revisamos rápido que todo esté bien y la soltamos al mundo, sin tu
          nombre. Que la descubran.
        </Text>
        <View style={styles.sentActions}>
          <PrimaryButton
            label="Volver al inicio"
            icon={<InboxIcon size={20} color="#ffffff" />}
            onPress={() => router.replace('/')}
          />
          <GhostButton label="Invitar a un amigo" onPress={inviteFriends} />
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
          <Text style={styles.kicker}>tu voz, lista</Text>
          <Text style={styles.title}>¿La sueltas?</Text>
        </View>
        <View style={styles.bottom}>
          <AudioPlayerCard
            duration={formatMs(recordedMs)}
            playing={previewPlaying}
            onTogglePlay={togglePreview}
          />
          {tooShort && (
            <Text style={styles.warn}>
              Muy corta. Graba algo un poco más largo.
            </Text>
          )}
          <View style={styles.spacer} />
          <PrimaryButton
            label={sending ? 'Enviando…' : 'Enviar voz'}
            icon={<InboxIcon size={20} color="#ffffff" />}
            onPress={send}
            disabled={sending || tooShort}
          />
          <GhostButton label="regrabar" onPress={reRecord} />
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
  bigEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  sentActions: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
});
