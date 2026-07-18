import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon } from '@/components/icons';
import {
  fetchVerificaciones,
  resolveVerificacion,
  type SolicitudItem,
} from '@/lib/admin';
import { haptics } from '@/lib/haptics';
import { t } from '@/lib/i18n';
import { colors, fonts, radius, spacing } from '@/theme';

export default function VerificacionesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<SolicitudItem[] | null>(null);

  const load = () => {
    fetchVerificaciones()
      .then(setItems)
      .catch(() => setItems([]));
  };
  useEffect(load, []);

  const resolve = async (id: number, aprobar: boolean) => {
    haptics.tap();
    setItems((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
    await resolveVerificacion(id, aprobar).catch(() => load());
  };

  return (
    <EmberBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('voice.back')}
          >
            <ArrowLeftIcon size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('verifs.header')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {items === null ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ember} size="large" />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.empty}>{t('verifs.empty')}</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {items.map((s) => (
              <View key={s.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.user}>@{s.username ?? '—'}</Text>
                  <View
                    style={[
                      styles.tag,
                      {
                        borderColor:
                          s.tipo === 'empresa' ? colors.emberBright : '#3897F0',
                      },
                    ]}
                  >
                    <Text style={styles.tagText}>{s.tipo}</Text>
                  </View>
                </View>
                {s.nota ? <Text style={styles.nota}>{s.nota}</Text> : null}
                {s.enlace ? (
                  <Text
                    style={styles.link}
                    onPress={() => Linking.openURL(s.enlace!).catch(() => {})}
                    numberOfLines={1}
                  >
                    {s.enlace}
                  </Text>
                ) : null}
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => resolve(s.id, false)}
                    style={({ pressed }) => [styles.reject, pressed && styles.pressed]}
                  >
                    <Text style={styles.rejectText}>{t('verifs.reject')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => resolve(s.id, true)}
                    style={({ pressed }) => [styles.approve, pressed && styles.pressed]}
                  >
                    <Text style={styles.approveText}>{t('verifs.approve')}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </EmberBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  headerSpacer: { width: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    fontFamily: fonts.labelRegular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  user: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  tag: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  tagText: {
    fontFamily: fonts.labelBold,
    fontSize: 11,
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  nota: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  link: {
    fontFamily: fonts.label,
    fontSize: 13,
    color: colors.emberBright,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  reject: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  approve: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#ffffff',
  },
  pressed: { opacity: 0.8 },
});
