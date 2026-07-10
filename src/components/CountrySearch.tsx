import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { COUNTRIES, type Country } from '@/constants/countries';
import { t } from '@/lib/i18n';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  onSelect: (c: Country) => void;
};

/** Quita acentos para comparar ("Perú" ↔ "peru"). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Alternativa accesible al mapa: buscar tu país escribiendo su nombre. */
export function CountrySearch({ onSelect }: Props) {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return COUNTRIES.filter((c) => normalize(c.name).includes(q)).slice(0, 6);
  }, [query]);

  return (
    <View style={styles.wrap}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('country.search')}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        style={styles.input}
        accessibilityLabel={t('country.search')}
      />
      {matches.length > 0 && (
        <View style={styles.results}>
          {matches.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => {
                onSelect(c);
                setQuery('');
              }}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Elegir ${c.name}`}
            >
              <Text style={styles.chipText}>
                {c.flag} {c.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.sm },
  input: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  results: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  pressed: { opacity: 0.7 },
});
