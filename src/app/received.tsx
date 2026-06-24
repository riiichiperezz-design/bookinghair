import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon, PauseIcon, PlayIcon } from '@/components/icons';
import { flagFor } from '@/constants/countries';
import { haptics } from '@/lib/haptics';
import {
  fetchReceivedVoices,
  fetchSentVoices,
  type SentVoice,
  type Voice,
} from '@/lib/voices';
import { colors, fonts, radius, spacing } from '@/theme';

function formatMs(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type Tab = 'received' | 'sent';

export default function ReceivedScreen() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>('received');
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
          <Text style={styles.headerTitle}>tus voces</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabs}>
          <TabButton
            label="Recibidas"
            active={tab === 'received'}
            onPress={() => setTab('received')}
          />
          <TabButton
            label="Enviadas"
            active={tab === 'sent'}
            onPress={() => setTab('sent')}
          />
        </View>

        {mounted ? (
          <Lists tab={tab} />
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ember} size="large" />
          </View>
        )}
      </SafeAreaView>
    </EmberBackground>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Lists({ tab }: { tab: Tab }) {
  const [received, setReceived] = useState<Voice[] | null>(null);
  const [sent, setSent] = useState<SentVoice[] | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currentUrl = useMemo(() => {
    const inReceived = received?.find((v) => v.id === currentId)?.audioUrl;
    const inSent = sent?.find((v) => v.id === currentId)?.audioUrl;
    return inReceived ?? inSent;
  }, [received, sent, currentId]);

  const player = useAudioPlayer(currentUrl ?? undefined);
  const playerStatus = useAudioPlayerStatus(player);
  const playing = playerStatus.playing;

  const load = async () => {
    const [r, s] = await Promise.all([
      fetchReceivedVoices().catch(() => []),
      fetchSentVoices().catch(() => []),
    ]);
    setReceived(r);
    setSent(s);
  };

  useEffect(() => {
    let active = true;
    load().finally(() => {
      if (!active) {
        // noop: evita warning si se desmonta
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!currentId) return;
    player.seekTo(0);
    player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const toggle = (id: string) => {
    haptics.tap();
    if (currentId === id) {
      if (playing) {
        player.pause();
      } else {
        player.seekTo(0);
        player.play();
      }
    } else {
      setCurrentId(id);
    }
  };

  const list = tab === 'received' ? received : sent;
  if (list === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ember} size="large" />
      </View>
    );
  }

  if (list.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>{tab === 'received' ? '📭' : '📡'}</Text>
        <Text style={styles.emptyTitle}>
          {tab === 'received'
            ? 'Aún no has recibido voces'
            : 'Aún no has enviado nada'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {tab === 'received'
            ? 'Manda una al mundo y reclama la de un desconocido.'
            : 'Suelta tu primera voz al mundo.'}
        </Text>
      </View>
    );
  }

  if (tab === 'received') {
    return (
      <FlatList
        data={received ?? []}
        keyExtractor={(v) => v.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.ember}
            colors={[colors.ember]}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Avatar name={item.username ?? '?'} size={44} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.username ? `@${item.username}` : 'anónima'}
              </Text>
              <Text style={styles.itemMeta} numberOfLines={1}>
                {item.country
                  ? `${flagFor(item.country)} ${item.country} · ${formatMs(item.duration_ms)}`
                  : formatMs(item.duration_ms)}
              </Text>
            </View>
            <PlayButton
              playing={currentId === item.id && playing}
              onPress={() => toggle(item.id)}
            />
          </View>
        )}
      />
    );
  }

  return (
    <FlatList
      data={sent ?? []}
      keyExtractor={(v) => v.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.ember}
          colors={[colors.ember]}
        />
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>
              Tu voz · {formatMs(item.duration_ms)}
            </Text>
            <View style={styles.sentMetaRow}>
              <Text
                style={[
                  styles.statusDot,
                  { color: item.claimed ? colors.emberBright : colors.textMuted },
                ]}
              >
                ●
              </Text>
              <Text style={styles.itemMeta}>
                {item.claimed ? 'escuchada' : 'esperando'}
              </Text>
              {item.reactions.length > 0 && (
                <View style={styles.reactionChips}>
                  {item.reactions.map((r) => (
                    <Text key={r.emoji} style={styles.reactionChip}>
                      {r.emoji} {r.count}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
          <PlayButton
            playing={currentId === item.id && playing}
            onPress={() => toggle(item.id)}
          />
        </View>
      )}
    />
  );
}

function PlayButton({
  playing,
  onPress,
}: {
  playing: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.playBtn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Pausar' : 'Reproducir'}
    >
      {playing ? (
        <PauseIcon size={20} color="#ffffff" />
      ) : (
        <PlayIcon size={20} color="#ffffff" />
      )}
    </Pressable>
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 22,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.ember,
  },
  tabText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
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
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  itemMeta: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  statusDot: {
    fontSize: 9,
  },
  reactionChips: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  reactionChip: {
    fontFamily: fonts.labelBold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  bigEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.8,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
