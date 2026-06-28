# Moderación de ECCO — operación y activación

Cómo funciona la moderación previa, qué falta para que sea **efectiva** en
producción, y los procedimientos asociados.

## 1. Flujo actual
1. El usuario sube una voz → nace `estado_moderacion = 'pendiente'`.
2. La app invoca la Edge Function `moderar-audio`.
3. La función ejecuta el **moderador configurado** y fija el estado:
   `aprobado` / `rechazado` / `revision_humana`.
4. `claim_voice()` **solo reparte audios `aprobado`**.

> Estado hoy: el moderador activo es **`ModeradorStub`**, que **aprueba por
> defecto** (solo desarrollo). La arquitectura está completa, pero **el filtrado
> real NO está activo** hasta hacer el paso 2 de abajo. **No abrir a usuarios
> reales con el Stub.**

## 2. 🔴 Activar el clasificador real (`ModeradorAPI`)
Pieza sustituible: no hay que tocar el resto del sistema.

1. Elige proveedores (no incluidos aquí): uno de **transcripción** (voz→texto) y
   uno de **clasificación de texto**.
2. Implementa los `TODO` de
   [`supabase/functions/moderar-audio/moderador-api.ts`](./supabase/functions/moderar-audio/moderador-api.ts):
   transcribir el `audioUrl` y clasificar el **significado** del mensaje en las
   categorías de [`categorias.ts`](./supabase/functions/moderar-audio/categorias.ts).
   Devuelve las categorías detectadas y deja que `evaluarCategorias` decida.
3. Configura los secretos (server-side, nunca en el cliente):
   ```bash
   supabase secrets set MODERADOR_IMPL=api \
     MODERACION_TRANSCRIPCION_API_KEY=... \
     MODERACION_CLASIFICADOR_API_KEY=...
   ```
4. Vuelve a desplegar (push a `supabase/functions/**` o `supabase functions deploy moderar-audio`).

Regla de oro ya implementada: **ante error o duda, nunca se aprueba**
(se queda `pendiente` o `revision_humana`).

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

## 6. Anti-abuso (activo)
- Límite de **30 voces / 24 h por usuario** (trigger `check_voice_rate_limit`,
  migración `0007`). Ajustable en el SQL.
- Reportar/bloquear y ocultado automático con 3+ incidencias (migración `0004`).

## 7. Observabilidad
- Punto único de errores en [`src/lib/log.ts`](./src/lib/log.ts), listo para
  enchufar **Sentry** (instrucciones en el propio archivo).
