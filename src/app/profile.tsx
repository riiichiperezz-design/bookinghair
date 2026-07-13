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

import { Avatar, type Badge } from '@/components/Avatar';
import { GhostButton, PrimaryButton } from '@/components/buttons';
import { CountrySearch } from '@/components/CountrySearch';
import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon } from '@/components/icons';
import { WorldMapPicker } from '@/components/WorldMapPicker';
import { type Country, flagFor } from '@/constants/countries';
import { deleteMyData, getAccountEmail, linkAccount } from '@/lib/account';
import { pickAndUploadAvatar } from '@/lib/avatar';
import { t } from '@/lib/i18n';
import { getApproxLocation } from '@/lib/location';
import { enableDailyReminder } from '@/lib/notifications';
import {
  getMyProfile,
  saveProfile,
  setVoiceAiConsent,
  UsernameTakenError,
} from '@/lib/profile';
import { shareReferral } from '@/lib/referral';
import { checkUsername } from '@/lib/username';
import { colors, fonts, radius, spacing } from '@/theme';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default function ProfileScreen() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkErr, setLinkErr] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bonus, setBonus] = useState(0);
  const [consentAi, setConsentAi] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [badge, setBadge] = useState<Badge>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const changePhoto = async () => {
    if (uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadAvatar();
      if (url) setAvatarUrl(url);
    } catch {
      // permiso denegado / cancelado
    } finally {
      setUploadingAvatar(false);
    }
  };

  const invite = async () => {
    const r = await shareReferral();
    if (r === 'copied') setInviteMsg(t('prof.copied'));
    else if (r === 'failed') setInviteMsg(t('prof.shareFail'));
  };

  useEffect(() => {
    let active = true;
    Promise.all([getMyProfile(), getAccountEmail()])
      .then(([p, email]) => {
        if (!active) return;
        setUsername(p?.username ?? '');
        setCountry(p?.country ?? null);
        setRegion(p?.region ?? null);
        setIsAdmin(p?.rol === 'admin');
        setBonus(p?.bonus_credits ?? 0);
        setConsentAi(p?.consent_voice_ai ?? false);
        setAvatarUrl(p?.avatar_url ?? null);
        setBadge(p?.badge ?? null);
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
      setLinkErr(e instanceof Error ? e.message : t('prof.linkFail'));
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

  const pickCountry = (c: Country) => {
    setCountry(c.name);
    setRegion(null);
  };

  const useMyLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const loc = await getApproxLocation();
      if (loc) {
        setCountry(loc.country.name);
        setRegion(loc.region);
      }
    } finally {
      setLocating(false);
    }
  };

  const toggleConsent = async () => {
    const next = !consentAi;
    setConsentAi(next);
    await setVoiceAiConsent(next).catch(() => {});
  };

  const save = async () => {
    if (!valid || saving) return;
    const bad = checkUsername(username);
    if (bad) {
      setError(bad);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveProfile(username, country, region);
      router.back();
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
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <ArrowLeftIcon size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('prof.header')}</Text>
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
              {/* Foto de perfil */}
              <View style={styles.avatarWrap}>
                <Pressable onPress={changePhoto} accessibilityRole="button">
                  <Avatar
                    name={username || '?'}
                    size={92}
                    uri={avatarUrl}
                    badge={badge}
                  />
                </Pressable>
                <Pressable
                  onPress={changePhoto}
                  hitSlop={8}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text style={styles.photoLink}>
                    {uploadingAvatar
                      ? t('prof.photoUp')
                      : avatarUrl
                        ? t('prof.photo')
                        : t('prof.addPhoto')}
                  </Text>
                </Pressable>
              </View>

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

              <Text style={styles.sectionLabel}>{t('setup.where')}</Text>
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

              {/* Invitar */}
              <Text style={styles.sectionLabel}>{t('prof.invite')}</Text>
              <Text style={styles.accountInfo}>
                {t('prof.inviteText')}
                <Text style={styles.bonusHi}>{t('prof.bonusWord')}</Text>.
                {bonus > 0 ? t('prof.bonusCount', { n: bonus }) : ''}
              </Text>
              <View style={styles.mt}>
                <GhostButton label={t('prof.share')} onPress={invite} />
              </View>
              {inviteMsg && <Text style={styles.helper}>{inviteMsg}</Text>}

              {/* Cuenta */}
              <Text style={styles.sectionLabel}>{t('prof.account')}</Text>
              {accountEmail ? (
                <Text style={styles.accountInfo}>
                  {t('prof.accountSaved', { e: accountEmail ?? '' })}
                </Text>
              ) : (
                <View>
                  <Text style={styles.accountInfo}>{t('prof.accountInfo')}</Text>
                  <View style={[styles.inputRow, styles.mt]}>
                    <TextInput
                      value={linkEmail}
                      onChangeText={setLinkEmail}
                      placeholder={t('prof.email')}
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
                      placeholder={t('prof.password')}
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      style={styles.input}
                    />
                  </View>
                  {linkErr && <Text style={styles.helper}>{linkErr}</Text>}
                  <View style={styles.mt}>
                    <GhostButton
                      label={linking ? t('prof.saving') : t('prof.saveAccount')}
                      onPress={linkNow}
                    />
                  </View>
                </View>
              )}

              {/* Privacidad de voz */}
              <Text style={styles.sectionLabel}>{t('prof.privacy')}</Text>
              <Pressable
                onPress={toggleConsent}
                style={({ pressed }) => [styles.consentRow, pressed && styles.pressed]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: consentAi }}
              >
                <View style={[styles.checkbox, consentAi && styles.checkboxOn]}>
                  {consentAi && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.consentText}>{t('setup.consentAi')}</Text>
              </Pressable>

              {/* Más */}
              <Text style={styles.sectionLabel}>{t('prof.more')}</Text>
              <Pressable
                onPress={async () => {
                  const ok = await enableDailyReminder();
                  setReminderMsg(ok ? t('prof.reminderOn') : t('prof.reminderWeb'));
                }}
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
              >
                <Text style={styles.linkText}>{t('prof.reminder')}</Text>
              </Pressable>
              {reminderMsg && <Text style={styles.helper}>{reminderMsg}</Text>}
              <Pressable
                onPress={() => router.push('/verificar')}
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
              >
                <Text style={styles.linkText}>{t('prof.verify')}</Text>
              </Pressable>
              {isAdmin && (
                <Pressable
                  onPress={() => router.push('/verificaciones')}
                  style={({ pressed }) => [
                    styles.linkRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.linkText}>{t('prof.verifs')}</Text>
                </Pressable>
              )}
              {isAdmin && (
                <Pressable
                  onPress={() => router.push('/admin')}
                  style={({ pressed }) => [
                    styles.linkRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.linkText}>{t('prof.admin')}</Text>
                </Pressable>
              )}
              {isAdmin && (
                <Pressable
                  onPress={() => router.push('/metrics')}
                  style={({ pressed }) => [
                    styles.linkRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.linkText}>{t('prof.metrics')}</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => router.push('/legal')}
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
              >
                <Text style={styles.linkText}>{t('prof.legal')}</Text>
              </Pressable>
              <Pressable
                onPress={onDelete}
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
              >
                <Text style={styles.dangerText}>
                  {confirmDelete ? t('prof.deleteConfirm') : t('prof.delete')}
                </Text>
              </Pressable>
            </ScrollView>

            <View style={styles.footer}>
              <PrimaryButton
                label={saving ? t('prof.saving') : t('prof.save')}
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
  avatarWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  photoLink: {
    fontFamily: fonts.label,
    fontSize: 13,
    color: colors.emberBright,
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
  mt: { marginTop: spacing.sm },
  accountInfo: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  bonusHi: {
    fontFamily: fonts.bodyBold,
    color: colors.emberBright,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  consentText: {
    flex: 1,
    fontFamily: fonts.labelRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
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
  checkboxMark: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#ffffff',
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
