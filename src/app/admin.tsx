import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon, PlayIcon } from '@/components/icons';
import {
  adminSignedUrl,
  fetchCola,
  fetchIncidencias,
  isAdmin,
  resolveAudio,
  type ColaItem,
  type IncidenciaItem,
} from '@/lib/admin';
import { colors, fonts, radius, spacing } from '@/theme';

export default function AdminScreen() {
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
          <Text style={styles.headerTitle}>moderación</Text>
          <View style={styles.headerSpacer} />
        </View>
        {mounted ? (
          <AdminInner />
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ember} size="large" />
          </View>
        )}
      </SafeAreaView>
    </EmberBackground>
  );
}

type Status = 'loading' | 'denied' | 'ready' | 'error';

function AdminInner() {
  const [status, setStatus] = useState<Status>('loading');
  const [cola, setCola] = useState<ColaItem[]>([]);
  const [incidencias, setIncidencias] = useState<IncidenciaItem[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(undefined);

  const player = useAudioPlayer(currentUrl);

  const load = async () => {
    const [c, i] = await Promise.all([fetchCola(), fetchIncidencias()]);
    setCola(c);
    setIncidencias(i);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ok = await isAdmin();
        if (!active) return;
        if (!ok) {
          setStatus('denied');
          return;
        }
        await load();
        if (active) setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUrl) return;
    player.seekTo(0);
    player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUrl]);

  const play = async (path: string) => {
    const url = await adminSignedUrl(path);
    if (url) setCurrentUrl(url);
  };

  const decide = async (audioId: string, decision: 'aprobado' | 'rechazado') => {
    await resolveAudio(audioId, decision).catch(() => {});
    await load().catch(() => {});
  };

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ember} size="large" />
      </View>
    );
  }
  if (status === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>🔒</Text>
        <Text style={styles.deniedTitle}>Solo para moderadores</Text>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedTitle}>No se pudo cargar</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.section}>Cola de revisión ({cola.length})</Text>
      {cola.length === 0 && <Text style={styles.empty}>Nada pendiente. 👌</Text>}
      {cola.map((c) => (
        <Item
          key={c.audio_id}
          motivo={c.motivo ?? 'sin clasificar'}
          transcripcion={c.transcripcion}
          estado={c.estado_moderacion}
          onPlay={() => play(c.audio_path)}
          onApprove={() => decide(c.audio_id, 'aprobado')}
          onReject={() => decide(c.audio_id, 'rechazado')}
        />
      ))}

      <Text style={[styles.section, styles.sectionGap]}>
        Reportes de usuarios ({incidencias.length})
      </Text>
      {incidencias.length === 0 && (
        <Text style={styles.empty}>Sin reportes abiertos.</Text>
      )}
      {incidencias.map((i) => (
        <Item
          key={i.audio_id}
          motivo={`${i.num} reporte(s)`}
          transcripcion={i.transcripcion}
          estado={i.estado_moderacion}
          onPlay={() => play(i.audio_path)}
          onApprove={() => decide(i.audio_id, 'aprobado')}
          onReject={() => decide(i.audio_id, 'rechazado')}
        />
      ))}
    </ScrollView>
  );
}

function Item({
  motivo,
  transcripcion,
  estado,
  onPlay,
  onApprove,
  onReject,
}: {
  motivo: string;
  transcripcion: string | null;
  estado: string;
  onPlay: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.item}>
      <View style={styles.itemTop}>
        <Pressable onPress={onPlay} style={styles.playBtn} hitSlop={6}>
          <PlayIcon size={18} color="#ffffff" />
        </Pressable>
        <View style={styles.itemInfo}>
          <Text style={styles.motivo}>{motivo}</Text>
          <Text style={styles.estado}>estado: {estado}</Text>
        </View>
      </View>
      <Text style={styles.transcripcion}>
        {transcripcion ? `“${transcripcion}”` : 'sin transcripción'}
      </Text>
      <View style={styles.actions}>
        <Pressable onPress={onReject} style={[styles.act, styles.reject]}>
          <Text style={styles.rejectTxt}>Rechazar</Text>
        </Pressable>
        <Pressable onPress={onApprove} style={[styles.act, styles.approve]}>
          <Text style={styles.approveTxt}>Aprobar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  headerSpacer: { width: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bigEmoji: { fontSize: 48, marginBottom: spacing.md },
  deniedTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
  },
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  section: {
    fontFamily: fonts.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  sectionGap: { marginTop: spacing.xl },
  empty: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  item: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  motivo: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  estado: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  transcripcion: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  act: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reject: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d9603f',
  },
  rejectTxt: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#d9603f' },
  approve: { backgroundColor: colors.ember },
  approveTxt: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#ffffff' },
});
