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
import {
  ArrowLeftIcon,
  FlameIcon,
  GlobeIcon,
  SendIcon,
  ShareIcon,
} from '@/components/icons';
import { ReactionGlyph, type ReactionName } from '@/components/ReactionIcons';
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
                <StatCard
                  label="enviadas"
                  value={stats.sent}
                  icon={<SendIcon size={18} color={colors.emberBright} />}
                />
                <StatCard
                  label="reacciones"
                  value={stats.reactions}
                  icon={<ReactionGlyph name="me_llega" size={18} />}
                />
                <StatCard
                  label="países"
                  value={stats.countries}
                  icon={<GlobeIcon size={18} color={colors.emberBright} />}
                />
                <StatCard
                  label="mejor racha"
                  value={stats.streakBest}
                  icon={<FlameIcon size={18} color={colors.emberBright} />}
                />
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
                  <View style={styles.itemIcon}>
                    <ReactionGlyph name={e.emoji as ReactionName} size={20} />
                  </View>
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
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
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
  statIcon: { height: 22, justifyContent: 'center' },
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
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
