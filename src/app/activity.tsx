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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon, ShareIcon } from '@/components/icons';
import {
  fetchReceivedReactions,
  getStats,
  markActivitySeen,
  type ReactionEvent,
  type Stats,
  timeAgo,
} from '@/lib/activity';
import { inviteFriends } from '@/lib/share';
import { colors, fonts, radius, spacing } from '@/theme';

export default function ActivityScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ReactionEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [evs, st] = await Promise.all([
          fetchReceivedReactions(),
          getStats(),
        ]);
        if (!active) return;
        setEvents(evs);
        setStats(st);
      } catch {
        // dejamos vacío
      } finally {
        if (active) setLoading(false);
        markActivitySeen();
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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
          <Text style={styles.headerTitle}>novedades</Text>
          <Pressable
            onPress={inviteFriends}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Invitar a un amigo"
          >
            <ShareIcon size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ember} size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats */}
            {stats && (
              <View style={styles.statsRow}>
                <StatCard label="enviadas" value={stats.sent} icon="📤" />
                <StatCard label="reacciones" value={stats.reactions} icon="❤️" />
                <StatCard label="países" value={stats.countries} icon="🌍" />
                <StatCard label="mejor racha" value={stats.streakBest} icon="🔥" />
              </View>
            )}

            <Text style={styles.sectionLabel}>tus voces gustan</Text>

            {events.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📡</Text>
                <Text style={styles.emptyTitle}>Aún no hay novedades</Text>
                <Text style={styles.emptyText}>
                  Cuando alguien reaccione a tus voces, lo verás aquí.
                </Text>
              </View>
            ) : (
              events.map((e, i) => (
                <Animated.View
                  key={e.id}
                  entering={FadeInDown.duration(360).delay(Math.min(i, 8) * 40)}
                  style={styles.item}
                >
                  <Text style={styles.itemEmoji}>{e.emoji}</Text>
                  <Text style={styles.itemText}>
                    Alguien reaccionó a tu voz
                  </Text>
                  <Text style={styles.itemTime}>{timeAgo(e.created_at)}</Text>
                </Animated.View>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </EmberBackground>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  scroll: { paddingTop: spacing.xl, paddingBottom: spacing.xl },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statIcon: { fontSize: 18 },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: fonts.labelRegular,
    fontSize: 10,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontFamily: fonts.label,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemEmoji: { fontSize: 22 },
  itemText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  itemTime: {
    fontFamily: fonts.labelRegular,
    fontSize: 11,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.6,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
