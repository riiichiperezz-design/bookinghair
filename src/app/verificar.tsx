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

import { PrimaryButton } from '@/components/buttons';
import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon } from '@/components/icons';
import { haptics } from '@/lib/haptics';
import { t } from '@/lib/i18n';
import { getMyProfile } from '@/lib/profile';
import {
  getMyVerification,
  requestVerification,
  type TipoVerificacion,
} from '@/lib/verification';
import { colors, fonts, radius, spacing } from '@/theme';

export default function VerificarScreen() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<'pendiente' | 'aprobada' | 'rechazada' | null>(
    null
  );
  const [hasName, setHasName] = useState(true);

  const [tipo, setTipo] = useState<TipoVerificacion>('verificado');
  const [enlace, setEnlace] = useState('');
  const [nota, setNota] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getMyVerification(), getMyProfile()])
      .then(([v, p]) => {
        if (!active) return;
        setStatus(v?.estado ?? null);
        setHasName(!!p?.username);
        setLoaded(true);
      })
      .catch(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  const submit = async () => {
    if (sending) return;
    setSending(true);
    try {
      await requestVerification(tipo, enlace, nota);
      haptics.success();
      setDone(true);
      setStatus('pendiente');
    } catch {
      // ya hay una pendiente / sin red
    } finally {
      setSending(false);
    }
  };

  const banner =
    done || status === 'pendiente'
      ? t('verify.pending')
      : status === 'aprobada'
        ? t('verify.approved')
        : status === 'rechazada'
          ? t('verify.rejected')
          : null;

  const canSubmit =
    hasName && !sending && status !== 'pendiente' && status !== 'aprobada';

  return (
    <EmberBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('voice.back')}
          >
            <ArrowLeftIcon size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('verify.header')}</Text>
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
              <Text style={styles.title}>{t('verify.title')}</Text>
              <Text style={styles.sub}>{t('verify.sub')}</Text>

              {banner && (
                <View style={styles.banner}>
                  <Text style={styles.bannerText}>{banner}</Text>
                </View>
              )}
              {!hasName && (
                <View style={styles.banner}>
                  <Text style={styles.bannerText}>{t('verify.needName')}</Text>
                </View>
              )}

              {canSubmit && (
                <>
                  <TypeCard
                    active={tipo === 'verificado'}
                    onPress={() => setTipo('verificado')}
                    title={t('verify.typePersona')}
                    sub={t('verify.typePersonaSub')}
                    color="#3897F0"
                  />
                  <TypeCard
                    active={tipo === 'empresa'}
                    onPress={() => setTipo('empresa')}
                    title={t('verify.typeEmpresa')}
                    sub={t('verify.typeEmpresaSub')}
                    color={colors.emberBright}
                  />

                  <Text style={styles.label}>{t('verify.linkLabel')}</Text>
                  <TextInput
                    value={enlace}
                    onChangeText={setEnlace}
                    placeholder={t('verify.linkPh')}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />

                  <Text style={styles.label}>{t('verify.noteLabel')}</Text>
                  <TextInput
                    value={nota}
                    onChangeText={setNota}
                    placeholder={t('verify.notePh')}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    style={[styles.input, styles.inputMultiline]}
                  />
                </>
              )}
            </ScrollView>

            {canSubmit && (
              <View style={styles.footer}>
                <PrimaryButton
                  label={sending ? t('verify.sending') : t('verify.submit')}
                  onPress={submit}
                  disabled={sending}
                />
              </View>
            )}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </EmberBackground>
  );
}

function TypeCard({
  active,
  onPress,
  title,
  sub,
  color,
}: {
  active: boolean;
  onPress: () => void;
  title: string;
  sub: string;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.typeCard,
        active && { borderColor: color, backgroundColor: colors.surfaceElevated },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <View style={[styles.dot, { borderColor: color }, active && { backgroundColor: color }]} />
      <View style={styles.typeInfo}>
        <Text style={styles.typeTitle}>{title}</Text>
        <Text style={styles.typeSub}>{sub}</Text>
      </View>
    </Pressable>
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
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: -1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sub: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  banner: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.ember,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bannerText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  typeInfo: { flex: 1 },
  typeTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  typeSub: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  label: {
    fontFamily: fonts.label,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputMultiline: {
    height: 90,
    textAlignVertical: 'top',
  },
  footer: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  pressed: { opacity: 0.8 },
});
