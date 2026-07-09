# ecco — Auditoría de seguridad, diseño y UX/UI

*(v1 — actualizar tras la beta. Complementa `AUDIT.md` y el dossier estratégico.)*

## 1. Seguridad — lo que ya está bien

| Área | Estado |
|---|---|
| RLS en todas las tablas (voices, profiles, incidencias, blocks, eventos…) | ✅ |
| Bucket de audio **privado** + URLs firmadas temporales | ✅ |
| Operaciones sensibles vía RPC `SECURITY DEFINER` (claim, report, referral, consent, metrics) | ✅ |
| **Moderación previa obligatoria** server-side; ante error nunca se aprueba | ✅ |
| `service_role` y claves de proveedores solo en Edge Functions (nunca en cliente/repo) | ✅ |
| Rate-limit por usuario **y** por dispositivo; ahora ritual 1/día | ✅ |
| Gate +17 y consentimiento de voz IA **opt-in separado y revocable** (GDPR Art. 9) | ✅ |
| Evidencia CSAM con tabla cerrada (solo service role) | ✅ |
| Reportar (con motivo) + bloquear + ocultado automático con 3+ reportes | ✅ |

## 2. Seguridad — hallazgos y plan

| # | Hallazgo | Riesgo | Acción |
|---|---|---|---|
| S1 | CORS `*` en las Edge Functions | Medio | Restringir `Access-Control-Allow-Origin` al dominio web (github.io / dominio final) cuando se fije el dominio. |
| S2 | `device_id` lo genera el cliente → límite de dispositivo **blando** | Medio | Para lanzamiento: App Attest / Play Integrity o captcha en registro. |
| S3 | URLs firmadas de 1 h reutilizables si se comparten | Medio | Con escucha única, bajar TTL a ~10 min en `claimVoice`. |
| S4 | `spotify-buscar` y `eventos` sin límite de frecuencia por usuario | Medio | Rate-limit sencillo por usuario/min en función y trigger en eventos. |
| S5 | Derecho al borrado GDPR: `deleteMyData` borra filas pero hay que garantizar borrado del **audio en Storage** y, si se licencian datos, **borrado selectivo del dataset** | Alto (si se venden datos) | Job de borrado de Storage + arquitectura de dataset con trazabilidad por usuario antes de licenciar. |
| S6 | Trigger 0009 lleva la anon key embebida | Bajo | Si se rota la anon key, re-ejecutar 0009. Documentado aquí. |
| S7 | Transcripciones (PII potencial) en logs de la función | Bajo | Revisar retención de logs de Supabase; no loguear transcripciones completas. |
| S8 | Deploy depende de `esm.sh` (falló con 522 una vez) | Bajo (fiabilidad) | Fijar versión exacta o import map vendored de `supabase-js` en las funciones. |
| S9 | Edad autodeclarada (checkbox) | Conocido | Estándar del sector; revisar exigencias de tienda al publicar. |

## 3. Diseño / UX-UI — lo que ya está bien

Identidad "brasa" coherente (fondo radial, ámbar, Hanken+Space Grotesk) · animaciones con propósito (reveal, celebración de racha, reacciones con física) · estados vacíos y de error con copy propio · haptics · labels de accesibilidad · pantalla de retención con racha y aviso diario · onboarding corto.

## 4. UX/UI — hallazgos y plan

| # | Hallazgo | Impacto | Acción |
|---|---|---|---|
| U1 | Al entrar a **grabar** no se avisa de que ya soltaste la voz de hoy: el error sale al enviar | Alto | Comprobar al montar `/record` y mostrar estado "ya está fuera, vuelve mañana" con cuenta atrás. |
| U2 | "Día" = medianoche **UTC** en servidor; la pantalla de retención cuenta hasta medianoche **local** (en España el reset real es ~1-2 h después de medianoche) | Alto | Unificar: contar hasta medianoche UTC en el cliente o usar zona del usuario en el servidor. |
| U3 | `/intro` no explica el ritual 1/día ni la escucha única | Medio | Añadir las 3 reglas al onboarding: una voz al día · entrega única · solo se escucha una vez. |
| U4 | Mapa: en pantallas pequeñas los puntos son finos; sin búsqueda por texto | Medio | Añadir campo de búsqueda de país como alternativa accesible al mapa. |
| U5 | Aviso de escucha única | Hecho ✅ | Kicker "solo se escucha una vez" añadido en `/voice`. |
| U6 | `Share.share` en algunos navegadores de escritorio no existe | Medio | Fallback: copiar el enlace al portapapeles con toast. |
| U7 | Todo el copy en español | Medio (visión global) | i18n EN antes de abrir fuera de hispanohablantes (expo-localization ya está). |
| U8 | Contraste de `textMuted` en labels muy pequeños | Bajo | Revisión de contraste AA en la pasada final de diseño. |
| U9 | Sin sonido/preview al elegir canción | Bajo | `preview_url` ya viaja; añadir pre-escucha de 30 s en el picker. |

## 5. Reportar / bloquear — análisis del flujo (rediseñado)

Antes: un toque en "reportar" enviaba el reporte sin motivo, sin confirmación y sin feedback (y `Alert` no funciona en web).

Ahora: hoja propia (web+móvil) con **motivo** (contenido sexual · odio/acoso · spam/estafa · otro) → se guarda en `incidencias.motivo` (alimenta el panel admin), opción **"bloquear también"** marcada por defecto, pausa el audio, confirmación "Gracias por avisar" y salida limpia. Server-side ya existía: no volver a recibir lo reportado, exclusión del emisor bloqueado y ocultado global con 3+ reportes.

Pendiente razonable: notificar al reportante si su reporte terminó en retirada (cierre de bucle de confianza) y ratio de reportes por usuario como señal anti-abuso.

## 6. Ritual diario (decisión de producto implementada)

- **1 voz enviada / día** (trigger, mensaje: "Ya has soltado tu voz de hoy").
- **1 voz recibida / día** (`claim_voice`): requiere haber mandado hoy **o** gastar una *voz extra* de referidos (se devuelve si el pool estaba vacío).
- Sin "Contestar premium": solo reacciones (decisión: simplicidad + escasez).
- Efecto buscado: escasez → hábito (modelo BeReal), y cada apertura importa.
