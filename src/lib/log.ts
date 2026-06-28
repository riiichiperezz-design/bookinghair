// Punto ÚNICO de registro de errores. Hoy escribe en consola; mañana se enchufa
// a Sentry (u otro) sin tocar el resto de la app.
//
// Para activar Sentry:
//   1) npx expo install @sentry/react-native
//   2) inicialízalo en src/app/_layout.tsx con tu DSN (EXPO_PUBLIC_SENTRY_DSN)
//   3) sustituye el cuerpo de logError por Sentry.captureException(error, ...).

function isDev(): boolean {
  // __DEV__ lo define Metro; fuera de RN puede no existir.
  return typeof (globalThis as { __DEV__?: boolean }).__DEV__ === 'undefined'
    ? false
    : !!(globalThis as { __DEV__?: boolean }).__DEV__;
}

/** Registra un error con contexto. No lanza nunca. */
export function logError(context: string, error: unknown): void {
  // TODO: Sentry.captureException(error, { tags: { context } });
  if (isDev()) {
    // eslint-disable-next-line no-console
    console.warn(`[ecco:${context}]`, error);
  }
}
