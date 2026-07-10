import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EqualizerIcon, PauseIcon, PlayIcon } from '@/components/icons';
import { t } from '@/lib/i18n';
import { searchTracks, type Song, toSong } from '@/lib/spotify';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  value: Song | null;
  onChange: (s: Song | null) => void;
};

type Result = Song & { preview: string | null };

/** Buscador opcional de canción de Spotify para acompañar una voz. */
export function SongPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-escucha de 30 s (si Spotify da preview para ese tema).
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const preview = useAudioPlayer(previewUrl ?? undefined);
  const previewStatus = useAudioPlayerStatus(preview);

  useEffect(() => {
    if (!previewUrl) return;
    preview.seekTo(0);
    preview.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]);

  const stopPreview = () => {
    if (previewStatus.playing) preview.pause();
    setPreviewUrl(null);
  };

  const togglePreview = (r: Result) => {
    if (!r.preview) return;
    if (previewUrl === r.preview) {
      if (previewStatus.playing) preview.pause();
      else {
        preview.seekTo(0);
        preview.play();
      }
    } else {
      setPreviewUrl(r.preview);
    }
  };

  const onType = (text: string) => {
    setQuery(text);
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const r = await searchTracks(text);
      setResults(r);
      setLoading(false);
    }, 350);
  };

  const pick = (r: Result) => {
    stopPreview();
    onChange(toSong(r));
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  // Canción ya elegida: mostramos el chip con opción de quitar.
  if (value) {
    return (
      <View style={styles.selected}>
        {value.image ? (
          <Image source={{ uri: value.image }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <EqualizerIcon size={16} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.selInfo}>
          <Text style={styles.selTitle} numberOfLines={1}>
            {value.title}
          </Text>
          <Text style={styles.selArtist} numberOfLines={1}>
            {value.artist}
          </Text>
        </View>
        <Pressable
          onPress={() => onChange(null)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('song.remove')}
        >
          <Text style={styles.remove}>{t('song.remove')}</Text>
        </Pressable>
      </View>
    );
  }

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('song.add')}
      >
        <View style={styles.addIcon}>
          <EqualizerIcon size={18} color={colors.emberBright} />
        </View>
        <View style={styles.addInfo}>
          <Text style={styles.addTitle}>{t('song.add')}</Text>
          <Text style={styles.addSub}>{t('song.addSub')}</Text>
        </View>
        <Text style={styles.addPlus}>+</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <TextInput
          value={query}
          onChangeText={onType}
          placeholder={t('song.search')}
          placeholderTextColor={colors.textMuted}
          autoFocus
          autoCorrect={false}
          style={styles.input}
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator color={colors.ember} size="small" />
        ) : (
          <Pressable
            onPress={() => {
              stopPreview();
              setOpen(false);
            }}
            hitSlop={8}
          >
            <Text style={styles.remove}>{t('song.close')}</Text>
          </Pressable>
        )}
      </View>

      {results.map((r) => (
        <Pressable
          key={r.id}
          onPress={() => pick(r)}
          style={({ pressed }) => [styles.result, pressed && styles.pressed]}
        >
          {r.image ? (
            <Image source={{ uri: r.image }} style={styles.resCover} />
          ) : (
            <View style={[styles.resCover, styles.coverFallback]}>
              <EqualizerIcon size={16} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.selInfo}>
            <Text style={styles.selTitle} numberOfLines={1}>
              {r.title}
            </Text>
            <Text style={styles.selArtist} numberOfLines={1}>
              {r.artist}
            </Text>
          </View>
          {r.preview != null && (
            <Pressable
              onPress={() => togglePreview(r)}
              hitSlop={8}
              style={({ pressed }) => [styles.prevBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('song.previewA11y')}
            >
              {previewUrl === r.preview && previewStatus.playing ? (
                <PauseIcon size={14} color={colors.textPrimary} />
              ) : (
                <PlayIcon size={14} color={colors.textPrimary} />
              )}
            </Pressable>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    paddingRight: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInfo: { flex: 1 },
  addTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  addSub: {
    fontFamily: fonts.labelRegular,
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  addPlus: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.emberBright,
  },
  pressed: { opacity: 0.7 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
    height: '100%',
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  resCover: { width: 40, height: 40, borderRadius: 6 },
  prevBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ember,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  cover: { width: 44, height: 44, borderRadius: 6 },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  note: { color: colors.textMuted, fontSize: 18 },
  selInfo: { flex: 1 },
  selTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  selArtist: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  remove: {
    fontFamily: fonts.label,
    fontSize: 12,
    color: colors.emberBright,
  },
});
