import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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

  const onType = (t: string) => {
    setQuery(t);
    if (timer.current) clearTimeout(timer.current);
    if (t.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const r = await searchTracks(t);
      setResults(r);
      setLoading(false);
    }, 350);
  };

  const pick = (r: Result) => {
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
            <Text style={styles.note}>♪</Text>
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
          accessibilityLabel="Quitar canción"
        >
          <Text style={styles.remove}>quitar</Text>
        </Pressable>
      </View>
    );
  }

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
      >
        <Text style={styles.addText}>🎵 acompañar con una canción</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <TextInput
          value={query}
          onChangeText={onType}
          placeholder="busca una canción o artista…"
          placeholderTextColor={colors.textMuted}
          autoFocus
          autoCorrect={false}
          style={styles.input}
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator color={colors.ember} size="small" />
        ) : (
          <Pressable onPress={() => setOpen(false)} hitSlop={8}>
            <Text style={styles.remove}>cerrar</Text>
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
              <Text style={styles.note}>♪</Text>
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
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  addBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  addText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
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
