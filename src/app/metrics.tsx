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
import { ArrowLeftIcon } from '@/components/icons';
import { fetchMetrics, type Metricas } from '@/lib/admin';
import { logError } from '@/lib/log';
import { colors, fonts, radius, spacing } from '@/theme';

export default function MetricsScreen() {
  const router = useRouter();
  const [data, setData] = useState<Metricas | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'denied' | 'error'>(
    'loading'
  );

  useEffect(() => {
    let active = true;
    fetchMetrics()
      .then((m) => {
        if (!active) return;
        if (!m) setState('denied');
        else {
          setData(m);
          setState('ok');
        }
      })
      .catch((e) => {
        logError('metrics.load', e);
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, []);

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
          <Text style={styles.headerTitle}>métricas</Text>
          <View style={styles.headerSpacer} />
        </View>

        {state === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ember} size="large" />
          </View>
        )}
        {state === 'denied' && (
          <View style={styles.center}>
            <Text style={styles.msg}>Solo para administradores.</Text>
          </View>
        )}
        {state === 'error' && (
          <View style={styles.center}>
            <Text style={styles.msg}>No se pudieron cargar las métricas.</Text>
          </View>
        )}

        {state === 'ok' && data && (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.section}>actividad</Text>
            <View style={styles.grid}>
              <Stat label="Usuarios" value={data.usuarios} />
              <Stat label="Activos hoy" value={data.dau} accent />
              <Stat label="Activos 7d" value={data.wau} />
              <Stat label="Activos 30d" value={data.mau} />
            </View>

            <Text style={styles.section}>bucle de voz</Text>
            <View style={styles.grid}>
              <Stat label="% que envía (7d)" value={`${data.pct_envia_7d}%`} accent />
              <Stat label="Enviadas hoy" value={data.enviadas_hoy} />
              <Stat label="Enviadas 7d" value={data.enviadas_7d} />
              <Stat label="Reclamadas 7d" value={data.reclamadas_7d} />
            </View>

            <Text style={styles.section}>últimos 7 días</Text>
            <Bars serie={data.serie} />
            <View style={styles.legend}>
              <LegendDot color={colors.ember} label="activos" />
              <LegendDot color={colors.emberBright} label="voces enviadas" />
            </View>

            <Text style={styles.note}>
              Datos en vivo desde tu Supabase. La retención (D1/D7/D30) se lee de
              la tabla de eventos; estos son los agregados clave del dossier.
            </Text>
          </ScrollView>
        )}
      </SafeAreaView>
    </EmberBackground>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statV, accent && styles.statAccent]}>{value}</Text>
      <Text style={styles.statK}>{label}</Text>
    </View>
  );
}

function Bars({ serie }: { serie: Metricas['serie'] }) {
  const max = Math.max(
    1,
    ...serie.map((d) => Math.max(d.activos, d.enviadas))
  );
  return (
    <View style={styles.bars}>
      {serie.map((d, i) => (
        <View key={i} style={styles.barCol}>
          <View style={styles.barPair}>
            <View
              style={[
                styles.bar,
                { height: `${(d.activos / max) * 100}%`, backgroundColor: colors.ember },
              ]}
            />
            <View
              style={[
                styles.bar,
                {
                  height: `${(d.enviadas / max) * 100}%`,
                  backgroundColor: colors.emberBright,
                },
              ]}
            />
          </View>
          <Text style={styles.barLabel}>{d.dia}</Text>
        </View>
      ))}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  headerSpacer: { width: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msg: {
    fontFamily: fonts.labelRegular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  section: {
    fontFamily: fonts.label,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  statV: {
    fontFamily: fonts.display,
    fontSize: 27,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  statAccent: { color: colors.emberBright },
  statK: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    height: 140,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: '86%',
  },
  bar: { width: 9, borderRadius: 3, minHeight: 2 },
  barLabel: {
    fontFamily: fonts.labelRegular,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  note: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
});
