import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/buttons';
import { EmberBackground } from '@/components/EmberBackground';
import { COUNTRIES, detectCountry } from '@/constants/countries';
import { saveProfile, UsernameTakenError } from '@/lib/profile';
import { colors, fonts, radius, spacing } from '@/theme';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default function SetupScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // País sugerido por la región del dispositivo.
  useEffect(() => {
    const d = detectCountry();
    if (d) setCountry(d);
  }, []);

  const valid = USERNAME_RE.test(username);

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveProfile(username, country);
      router.replace('/intro');
    } catch (e) {
      if (e instanceof UsernameTakenError) {
        setError(e.message);
      } else {
        setError(
          e instanceof Error ? e.message : 'No se pudo guardar. Inténtalo otra vez.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <EmberBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.wordmark}>
              ECCO<Text style={styles.wordmarkDot}>.</Text>
            </Text>

            <Text style={styles.title}>¿Cómo te llaman?</Text>
            <Text style={styles.subtitle}>
              Tu @usuario solo aparece cuando alguien abre tu voz.
            </Text>

            {/* Usuario */}
            <View style={styles.inputRow}>
              <Text style={styles.at}>@</Text>
              <TextInput
                value={username}
                onChangeText={(t) =>
                  setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                placeholder="tu_nombre"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                style={styles.input}
                returnKeyType="done"
              />
            </View>
            <Text style={styles.helper}>
              {error ?? 'minúsculas, números y _ · 3 a 20 caracteres'}
            </Text>

            {/* País */}
            <Text style={styles.sectionLabel}>¿de dónde eres?</Text>
            <View style={styles.countryWrap}>
              {COUNTRIES.map((c) => {
                const selected = country === c.name;
                return (
                  <Pressable
                    key={c.name}
                    onPress={() => setCountry(selected ? null : c.name)}
                    style={({ pressed }) => [
                      styles.chip,
                      selected && styles.chipSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.chipFlag}>{c.flag}</Text>
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              label={saving ? 'Guardando…' : 'Entrar a ecco'}
              onPress={submit}
              disabled={!valid || saving}
            />
            <Text style={styles.consent}>
              Al entrar aceptas la{' '}
              <Text style={styles.consentLink} onPress={() => router.push('/legal')}>
                privacidad y términos
              </Text>
              .
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </EmberBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  wordmark: {
    fontFamily: fonts.labelBold,
    fontSize: 13,
    letterSpacing: 3,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  wordmarkDot: { color: colors.ember },
  consent: {
    fontFamily: fonts.labelRegular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  consentLink: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 56,
    gap: spacing.xs,
  },
  at: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ember,
  },
  input: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.textPrimary,
    height: '100%',
  },
  helper: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionLabel: {
    fontFamily: fonts.label,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
  },
  chipSelected: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.ember,
  },
  chipFlag: { fontSize: 15 },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextSelected: { color: colors.textPrimary },
  pressed: { opacity: 0.7 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
});
