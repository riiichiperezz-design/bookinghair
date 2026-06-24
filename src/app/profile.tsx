import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

import { GhostButton, PrimaryButton } from '@/components/buttons';
import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon } from '@/components/icons';
import { COUNTRIES } from '@/constants/countries';
import { deleteMyData, getAccountEmail, linkAccount } from '@/lib/account';
import { getMyProfile, saveProfile, UsernameTakenError } from '@/lib/profile';
import { colors, fonts, radius, spacing } from '@/theme';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default function ProfileScreen() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkErr, setLinkErr] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getMyProfile(), getAccountEmail()])
      .then(([p, email]) => {
        if (!active) return;
        setUsername(p?.username ?? '');
        setCountry(p?.country ?? null);
        setAccountEmail(email);
        setLoaded(true);
      })
      .catch(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  const canLink =
    /.+@.+\..+/.test(linkEmail.trim()) && linkPassword.length >= 6;

  const linkNow = async () => {
    if (!canLink || linking) return;
    setLinking(true);
    setLinkErr(null);
    try {
      await linkAccount(linkEmail.trim(), linkPassword);
      setAccountEmail(linkEmail.trim());
      setLinkPassword('');
    } catch (e) {
      setLinkErr(e instanceof Error ? e.message : 'No se pudo vincular.');
    } finally {
      setLinking(false);
    }
  };

  const onDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteMyData().catch(() => {});
    router.replace('/');
  };

  const valid = USERNAME_RE.test(username);

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveProfile(username, country);
      router.back();
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
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <ArrowLeftIcon size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>editar perfil</Text>
          <View style={styles.headerSpacer} />
        </View>

        {!loaded ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ember} size="large" />
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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

              {/* Cuenta */}
              <Text style={styles.sectionLabel}>tu cuenta</Text>
              {accountEmail ? (
                <Text style={styles.accountInfo}>
                  Guardada como {accountEmail} ✓
                </Text>
              ) : (
                <View>
                  <Text style={styles.accountInfo}>
                    Solo en este dispositivo. Vincula un email para no perder tu
                    @usuario, racha y voces si reinstalas.
                  </Text>
                  <View style={[styles.inputRow, styles.mt]}>
                    <TextInput
                      value={linkEmail}
                      onChangeText={setLinkEmail}
                      placeholder="email"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      style={styles.input}
                    />
                  </View>
                  <View style={[styles.inputRow, styles.mt]}>
                    <TextInput
                      value={linkPassword}
                      onChangeText={setLinkPassword}
                      placeholder="contraseña (mín. 6)"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      style={styles.input}
                    />
                  </View>
                  {linkErr && <Text style={styles.helper}>{linkErr}</Text>}
                  <View style={styles.mt}>
                    <GhostButton
                      label={linking ? 'Guardando…' : 'Guardar mi cuenta'}
                      onPress={linkNow}
                    />
                  </View>
                </View>
              )}

              {/* Más */}
              <Text style={styles.sectionLabel}>más</Text>
              <Pressable
                onPress={() => router.push('/legal')}
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
              >
                <Text style={styles.linkText}>Privacidad y términos</Text>
              </Pressable>
              <Pressable
                onPress={onDelete}
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
              >
                <Text style={styles.dangerText}>
                  {confirmDelete ? 'Toca otra vez para borrar' : 'Borrar mis datos'}
                </Text>
              </Pressable>
            </ScrollView>

            <View style={styles.footer}>
              <PrimaryButton
                label={saving ? 'Guardando…' : 'Guardar cambios'}
                onPress={save}
                disabled={!valid || saving}
              />
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </EmberBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  flex: { flex: 1 },
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
  scroll: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
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
  at: { fontFamily: fonts.display, fontSize: 20, color: colors.ember },
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
  mt: { marginTop: spacing.sm },
  accountInfo: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  linkRow: {
    paddingVertical: spacing.md,
  },
  linkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  dangerText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#d9603f',
  },
  footer: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
});
