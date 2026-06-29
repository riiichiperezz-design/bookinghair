# Moderación de ECCO — operación y activación

Cómo funciona la moderación previa, qué falta para que sea **efectiva** en
producción, y los procedimientos asociados.

## 1. Flujo actual
1. El usuario sube una voz → nace `estado_moderacion = 'pendiente'`.
2. La app invoca la Edge Function `moderar-audio`.
3. La función ejecuta el **moderador configurado** y fija el estado:
   `aprobado` / `rechazado` / `revision_humana`.
4. `claim_voice()` **solo reparte audios `aprobado`**.

> Selección automática del moderador
> ([`config.ts`](./supabase/functions/moderar-audio/config.ts)): si está la clave
> `GROQ_API_KEY`, se usa **`ModeradorAPI`** (real); si no, **`ModeradorStub`**
> (aprueba por defecto, **solo desarrollo**). Puedes forzar con
> `MODERADOR_IMPL=stub|api`. **No abrir a usuarios reales con el Stub.**

## 2. 🔴 Activar el clasificador real (`ModeradorAPI`)
Pieza sustituible: no hay que tocar el resto del sistema. La implementación real
ya está en
[`moderador-api.ts`](./supabase/functions/moderar-audio/moderador-api.ts) y usa
**solo Groq** (un proveedor, plan gratuito): transcribe el `audioUrl` con Whisper
(`whisper-large-v3-turbo`) y clasifica el **significado** con un modelo de chat
(`openai/gpt-oss-20b`, pesos abiertos en Groq), mapeando a las categorías de
[`categorias.ts`](./supabase/functions/moderar-audio/categorias.ts) para que
`evaluarCategorias` decida.

1. Configura el secreto (server-side, nunca en el cliente ni en el repo):
   ```bash
   supabase secrets set GROQ_API_KEY=...
   # opcional: forzar implementación
   supabase secrets set MODERADOR_IMPL=api
   ```
2. Vuelve a desplegar (push a `supabase/functions/**` o
   `supabase functions deploy moderar-audio`).

> Nota sobre modelos: Groq deprecó `llama-guard` y `llama-3.x` durante 2026; por
> eso la clasificación usa `openai/gpt-oss-20b`. Si Groq lo deprecara, basta con
> cambiar `GROQ_MODERATION_MODEL` en `moderador-api.ts`.

Regla de oro ya implementada: **ante error o duda, nunca se aprueba** — si el
proveedor falla, `ModeradorAPI` lanza y la función deja la voz `pendiente`
(nunca `aprobado`).

## 3. Política de contenido
Definida como constante única en
[`src/constants/moderacion.ts`](./src/constants/moderacion.ts) (espejo server-side en
`categorias.ts`). 10 categorías, su acción y la severidad. Tests en
[`tests/moderacion.test.ts`](./tests/moderacion.test.ts) (CI las ejecuta en cada push)
garantizan que "gana la acción más severa" y que **entradas inesperadas nunca
aprueban**.

## 4. Procedimiento CSAM (explotación sexual infantil) — máxima gravedad
- Acción automática: **rechazo** + **conservación de evidencia**.
- La Edge Function guarda metadatos en `public.moderacion_evidencia`
  (`audio_id`, `categoria`, `transcripcion`, `audio_path`) — tabla con RLS cerrada
  (solo rol de servicio).
- **Obligación legal (a definir por el equipo/jurídico):** preservar el material
  y **reportar a la autoridad competente** (p. ej. NCMEC en EE. UU. / fuerzas y
  cuerpos de seguridad y el canal correspondiente en la UE/España). No borrar la
  evidencia hasta cumplir el procedimiento. Designar un responsable y un SLA.

## 5. Revisión humana
- Cola en `cola_moderacion`; reportes de usuarios en `incidencias`.
- Panel en la app (`/admin`), solo para `profiles.rol = 'admin'`: escuchar audio,
  leer transcripción y aprobar/rechazar.
- Recomendado: definir SLA de revisión y registro de decisiones.

## 6. Fiabilidad de la moderación (no quedarse en `pendiente`)
La voz se modera de forma asíncrona. Si la invocación inicial falla, la voz
quedaría `pendiente` (y por tanto **no repartible**, lo cual es seguro pero la
deja en el limbo). Tres capas evitan que se quede ahí:

1. **Idempotencia** — la Edge Function sale temprano si la voz ya tiene decisión
   (`estado_moderacion !== 'pendiente'`). Reintentar es seguro: no duplica
   trabajo ni evidencia.
2. **Barrido en cliente** — al abrir la home, `remoderarPendientes()`
   ([`src/lib/voices.ts`](./src/lib/voices.ts)) re-invoca la función para tus
   voces `pendiente` de las últimas 24 h.
3. **Disparo en servidor (recomendado, independiente del cliente)** — crea un
   **Database Webhook** en Supabase para no depender de que la app esté abierta:
   - Dashboard → *Database* → *Webhooks* → *Create a new hook*.
   - Tabla `public.voices`, evento **INSERT**.
   - Tipo **Supabase Edge Functions** → función `moderar-audio`.
   - El webhook envía `{ record: { id, ... } }`; la función ya acepta
     `audioId`/`audio_id`, así que mapea el body a `{ "audioId": "{{ record.id }}" }`
     (o añade soporte para `record.id` en `index.ts` si usas el payload crudo).
   Con esto cada INSERT dispara la moderación en el servidor; el barrido en
   cliente queda como red de seguridad secundaria.

## 7. Anti-abuso (activo)
- Límite de **30 voces / 24 h por usuario** y **40 / 24 h por dispositivo**
  (trigger `check_voice_rate_limit`, migraciones `0007` + `0008`). El
  `device_id` lo aporta el cliente ([`src/lib/device.ts`](./src/lib/device.ts)),
  así que es un límite **blando** que sube el listón frente a multicuentas desde
  el mismo aparato; el control fuerte (captcha/attestation) queda como mejora.
- **Gate de edad +17** en el onboarding (`/setup`): hay que confirmarlo para
  entrar.
- Reportar/bloquear y ocultado automático con 3+ incidencias (migración `0004`).

## 8. Observabilidad
- Punto único de errores en [`src/lib/log.ts`](./src/lib/log.ts), listo para
  enchufar **Sentry** (instrucciones en el propio archivo).
