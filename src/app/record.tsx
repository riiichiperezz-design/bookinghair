import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlayerCard } from '@/components/AudioPlayerCard';
import { GhostButton, PrimaryButton } from '@/components/buttons';
import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon, InboxIcon } from '@/components/icons';
import { RecordButton } from '@/components/RecordButton';
import { colors, fonts, spacing } from '@/theme';

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
        {recording ? 'toca para parar' : 'toca para empezar a grabar'}
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
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [sent, setSent] = useState(false);

  const player = useAudioPlayer(recordedUri ?? undefined);

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
    setPreviewPlaying(false);
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopRecording = async () => {
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

  const togglePreview = () => {
    if (previewPlaying) {
      player.pause();
      setPreviewPlaying(false);
    } else {
      player.seekTo(0);
      player.play();
      setPreviewPlaying(true);
    }
  };

  const reRecord = () => {
    setRecordedUri(null);
    setPreviewPlaying(false);
    setRecordedMs(0);
  };

  const send = () => {
    // TODO: subir el audio a Supabase Storage y crear la fila en `voices`.
    setSent(true);
  };

  if (sent) {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>🔥</Text>
        <Text style={styles.title}>Tu voz va de camino</Text>
        <Text style={styles.subtitle}>
          Llegará sin tu nombre. Que la descubran.
        </Text>
        <View style={styles.sentActions}>
          <PrimaryButton
            label="Volver al inicio"
            icon={<InboxIcon size={20} color="#ffffff" />}
            onPress={() => router.replace('/')}
          />
        </View>
      </View>
    );
  }

  const hasRecording = recordedUri != null && !recorderState.isRecording;

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
          <View style={styles.spacer} />
          <PrimaryButton
            label="Enviar voz"
            icon={<InboxIcon size={20} color="#ffffff" />}
            onPress={send}
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
  bigEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  sentActions: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
});
