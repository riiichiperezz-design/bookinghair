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

import { GhostButton, PrimaryButton } from '@/components/buttons';
import { CountrySearch } from '@/components/CountrySearch';
import { EmberBackground } from '@/components/EmberBackground';
import { WorldMapPicker } from '@/components/WorldMapPicker';
import { CheckIcon } from '@/components/icons';
import { type Country, detectCountry, flagFor } from '@/constants/countries';
import { t } from '@/lib/i18n';
import { getApproxLocation } from '@/lib/location';
import { saveProfile, setVoiceAiConsent, UsernameTakenError } from '@/lib/profile';
import { redeemPendingReferral } from '@/lib/referral';
import { checkUsername } from '@/lib/username';
import { colors, fonts, radius, spacing } from '@/theme';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default function SetupScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [over17, setOver17] = useState(false);
  const [consentAi, setConsentAi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // País sugerido por la región del dispositivo.
  useEffect(() => {
    const d = detectCountry();
    if (d) setCountry(d);
  }, []);

  const pickCountry = (c: Country) => {
    setCountry(c.name);
    setRegion(null); // al tocar el mapa se elige país; la región vendrá del GPS
  };

  const useMyLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const loc = await getApproxLocation();
      if (loc) {
        setCountry(loc.country.name);
        setRegion(loc.region);
      } else {
        setError(t('setup.locError'));
      }
    } finally {
      setLocating(false);
    }
  };

  const valid = USERNAME_RE.test(username);
  const canSubmit = valid && over17 && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    const bad = checkUsername(username);
    if (bad) {
      setError(bad);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveProfile(username, country, region);
      await setVoiceAiConsent(consentAi);
      redeemPendingReferral().catch(() => {});
      router.replace('/intro');
    } catch (e) {
      if (e instanceof UsernameTakenError) {
        setError(e.message);
      } else {
        setError(
          e instanceof Error ? e.message : t('setup.saveError')
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

            <Text style={styles.title}>{t('setup.title')}</Text>
            <Text style={styles.subtitle}>
              {t('setup.subtitle')}
            </Text>

            {/* Usuario */}
            <View style={styles.inputRow}>
              <Text style={styles.at}>@</Text>
              <TextInput
                value={username}
                onChangeText={(t) =>
                  setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                placeholder={t('setup.placeholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                style={styles.input}
                returnKeyType="done"
              />
            </View>
            <Text style={styles.helper}>
              {error ?? t('setup.helper')}
            </Text>

            {/* De dónde eres — mapa interactivo */}
            <Text style={styles.sectionLabel}>{t('setup.where')}</Text>
            <Text style={styles.mapHint}>{t('setup.mapHint')}</Text>
            <WorldMapPicker selected={country} onSelect={pickCountry} />
            <CountrySearch onSelect={pickCountry} />

            <View style={styles.placeRow}>
              <Text style={styles.placeLabel} numberOfLines={1}>
                {country
                  ? `${flagFor(country)} ${country}${region ? ` · ${region}` : ''}`
                  : t('setup.none')}
              </Text>
            </View>

            <GhostButton
              label={locating ? t('setup.locating') : t('setup.useLocation')}
              onPress={useMyLocation}
            />
          </ScrollView>

          <View style={styles.footer}>
            {/* Gate de edad: ecco es +17 (mensajes de voz de desconocidos). */}
            <Pressable
              onPress={() => setOver17((v) => !v)}
              style={({ pressed }) => [styles.ageRow, pressed && styles.pressed]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: over17 }}
              accessibilityLabel={t('setup.age')}
            >
              <View style={[styles.checkbox, over17 && styles.checkboxOn]}>
                {over17 && <CheckIcon size={13} color={colors.textOnEmber} />}
              </View>
              <Text style={styles.ageText}>
                {t('setup.age')}
              </Text>
            </Pressable>

            {/* Consentimiento opcional para uso de la voz en IA (opt-in). */}
            <Pressable
              onPress={() => setConsentAi((v) => !v)}
              style={({ pressed }) => [styles.ageRow, pressed && styles.pressed]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consentAi }}
              accessibilityLabel={t('setup.consentAi')}
            >
              <View style={[styles.checkbox, consentAi && styles.checkboxOn]}>
                {consentAi && <CheckIcon size={13} color={colors.textOnEmber} />}
              </View>
              <Text style={styles.ageText}>
                <Text style={styles.optional}>{t('setup.optional')}</Text>
                {t('setup.consentAi')}
              </Text>
            </Pressable>

            <PrimaryButton
              label={saving ? t('setup.saving') : t('setup.enter')}
              onPress={submit}
              disabled={!canSubmit}
            />
            <Text style={styles.consent}>
              {t('setup.legalPre')}
              <Text style={styles.consentLink} onPress={() => router.push('/legal')}>
                {t('setup.legalLink')}
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
  mapHint: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  placeRow: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  placeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  pressed: { opacity: 0.7 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.ember,
    borderColor: colors.ember,
  },
  ageText: {
    flex: 1,
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  optional: {
    fontFamily: fonts.labelBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
