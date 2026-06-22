import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon, PauseIcon, PlayIcon } from '@/components/icons';
import { flagFor } from '@/constants/countries';
import { fetchReceivedVoices, type Voice } from '@/lib/voices';
import { colors, fonts, radius, spacing } from '@/theme';

function formatMs(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ReceivedScreen() {
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
          <Text style={styles.headerTitle}>tus voces</Text>
          <View style={styles.headerSpacer} />
        </View>
        {mounted ? (
          <ReceivedList />
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ember} size="large" />
          </View>
        )}
      </SafeAreaView>
    </EmberBackground>
  );
}

function ReceivedList() {
  const router = useRouter();
  const [voices, setVoices] = useState<Voice[] | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const current = useMemo(
    () => voices?.find((v) => v.id === currentId) ?? null,
    [voices, currentId]
  );
  const player = useAudioPlayer(current?.audioUrl ?? undefined);

  useEffect(() => {
    let active = true;
    fetchReceivedVoices()
      .then((v) => active && setVoices(v))
      .catch(() => active && setVoices([]));
    return () => {
      active = false;
    };
  }, []);

  // Al cambiar de pista, reproduce desde el principio.
  useEffect(() => {
    if (!currentId) return;
    player.seekTo(0);
    player.play();
    setPlaying(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const toggle = (id: string) => {
    if (currentId === id) {
      if (playing) {
        player.pause();
        setPlaying(false);
      } else {
        player.play();
        setPlaying(true);
      }
    } else {
      setCurrentId(id);
    }
  };

  if (voices === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ember} size="large" />
      </View>
    );
  }

  if (voices.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>📭</Text>
        <Text style={styles.emptyTitle}>Aún no has recibido voces</Text>
        <Text style={styles.emptySubtitle}>
          Manda una al mundo y reclama la de un desconocido.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={voices}
      keyExtractor={(v) => v.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const isCurrent = currentId === item.id;
        const isPlaying = isCurrent && playing;
        return (
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
            <Pressable
              onPress={() => toggle(item.id)}
              style={({ pressed }) => [
                styles.playBtn,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? (
                <PauseIcon size={20} color="#ffffff" />
              ) : (
                <PlayIcon size={20} color="#ffffff" />
              )}
            </Pressable>
          </View>
        );
      }}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingTop: spacing.xl,
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
