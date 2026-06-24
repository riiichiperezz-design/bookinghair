# ecco 🔥

App social de **mensajes de voz anónimos**. Mandas una voz al mundo y recibes la
de un total desconocido. Cada audio es **único**: se entrega a una sola persona.

> _"Alguien te ha mandado algo. No sabes quién. Solo le das al play."_

## El bucle

1. **Sueltas una voz** (graba y envía, sin decir quién eres).
2. **Das para recibir**: por cada voz que mandas, puedes reclamar la de otro.
3. **Entrega única (1 a 1)**: al abrirla, esa voz es solo tuya y sale del pool.
4. **Reaccionas** con un emoji. _Contestar_ es una función premium (próximamente).

## Stack

- **Expo SDK 56** + **expo-router** (TypeScript)
- **expo-audio** (grabar/reproducir) · **Supabase** (datos + Storage + auth anónima)
- **react-native-reanimated** (animaciones) · **expo-notifications** (recordatorios)

## Puesta en marcha

```bash
npm install
```

Crea un `.env` con tus claves de Supabase (las `EXPO_PUBLIC_*` se embeben en el cliente):

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Configura el backend siguiendo [`supabase/README.md`](./supabase/README.md):
activa el login anónimo y ejecuta las migraciones `0001` y `0002`.

Arranca:

```bash
npx expo start      # pulsa 'w' para web
```

Para probar en el móvil (Expo Go no soporta SDK 56) usa un development build:
ver [`MOBILE.md`](./MOBILE.md).

## Estructura

```
src/
  app/            # rutas (expo-router): home, voice, record, received,
                  #   activity, setup, intro, profile
  components/     # UI reutilizable (botones, onda, reproductor, iconos…)
  constants/      # países
  lib/            # supabase, sesión, voces, perfil, rachas, novedades,
                  #   notificaciones, háptica, compartir, storage
  theme/          # sistema de diseño "brasa" (colores, tipografías…)
supabase/         # migraciones SQL + guía del dashboard
```

## Retención y viralidad

- **Rachas diarias** (🔥) con celebración de hitos.
- **Novedades**: quién reaccionó a tus voces + estadísticas.
- **Recordatorio diario** local para no perder la racha.
- **Invitar** con la hoja de compartir del sistema.
