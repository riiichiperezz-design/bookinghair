import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmberBackground } from '@/components/EmberBackground';
import { ArrowLeftIcon } from '@/components/icons';
import { colors, fonts, spacing } from '@/theme';

const PRIVACY = [
  ['Qué guardamos', 'Tu @usuario, país (opcional) y las notas de voz que envías o recibes. No pedimos tu nombre real ni tu agenda. La sesión es anónima por dispositivo.'],
  ['Tus voces', 'Los audios se guardan cifrados en reposo y solo son accesibles mediante enlaces firmados temporales para la persona que los envía y la que los recibe.'],
  ['Reacciones', 'Las reacciones son anónimas: el autor de una voz ve que ha recibido una reacción, pero no quién la dejó.'],
  ['Moderación', 'Puedes reportar o bloquear cualquier voz. Las voces con varios reportes se ocultan automáticamente.'],
  ['Tus derechos', 'Puedes borrar tus datos desde tu perfil ("Borrar mis datos"). Para dudas, escríbenos.'],
];

const TERMS = [
  ['Uso aceptable', 'ecco es para compartir voces de forma respetuosa. No se permite acoso, odio, contenido sexual con menores, amenazas ni spam.'],
  ['Edad mínima', 'Debes tener al menos 17 años para usar ecco.'],
  ['Consecuencias', 'El contenido que infrinja estas normas puede ser ocultado y la cuenta restringida.'],
  ['Sin garantías', 'ecco se ofrece "tal cual"; hacemos lo posible por mantener el servicio disponible y seguro.'],
];

export default function LegalScreen() {
  const router = useRouter();
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
          <Text style={styles.headerTitle}>privacidad y términos</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.h1}>Privacidad</Text>
          {PRIVACY.map(([t, b]) => (
            <View key={t} style={styles.block}>
              <Text style={styles.h2}>{t}</Text>
              <Text style={styles.p}>{b}</Text>
            </View>
          ))}

          <Text style={[styles.h1, styles.h1Spaced]}>Términos</Text>
          {TERMS.map(([t, b]) => (
            <View key={t} style={styles.block}>
              <Text style={styles.h2}>{t}</Text>
              <Text style={styles.p}>{b}</Text>
            </View>
          ))}

          <Text style={styles.note}>
            Resumen orientativo. Revísalo y adáptalo con asesoría legal antes de
            publicar en las tiendas.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </EmberBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl },
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
  scroll: { paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  h1: {
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: -0.8,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  h1Spaced: { marginTop: spacing.xl },
  block: { marginBottom: spacing.lg },
  h2: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  p: {
    fontFamily: fonts.labelRegular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  note: {
    fontFamily: fonts.labelRegular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
