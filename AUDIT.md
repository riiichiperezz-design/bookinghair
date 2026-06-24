# Auditoría de ecco

Estado a día de hoy: MVP **funcional** (web desplegada, flujo completo de
mandar/recibir/reaccionar, rachas, novedades, perfiles). Esto es lo que **falta**,
lo que **falla/arriesga** y la **ruta para publicarla como app real**.

---

## 0. Resuelto desde la primera auditoría ✅

- 🔒 **Seguridad del audio**: bucket privado + URLs firmadas + RLS estricto (0003).
- 🛡️ **Moderación**: reportar/bloquear + filtrado en `claim_voice()` (0004).
- 🔔 **Push reales**: triggers `pg_net` → Expo Push (0005).
- 🧑 **Identidad recuperable**: vincular email a la cuenta anónima.
- 🗑️ **Borrado de datos** (GDPR) desde el perfil.
- 📄 **Privacidad y términos** (pantalla `/legal` + consentimiento).
- 🌍 **País automático** por región del dispositivo.

Pendiente principal: telemetría (Sentry/analítica), realtime, tests, y los
trámites de tienda (capturas, política publicada en una URL, cuentas de pago).

---

## 1. Lo que ya funciona ✅

- Onboarding (`@usuario` + país), home, grabar/enviar, recibir (1‑a‑1), reaccionar.
- Entrega única atómica vía `claim_voice()` y "mandar para recibir".
- Rachas diarias + celebración, Novedades (reacciones recibidas) + stats.
- Recordatorio local diario, compartir/invitar, splash y branding propios.
- Web desplegada en GitHub Pages; build de móvil (EAS) configurado.

---

## 2. Fallos y riesgos (ordenados por gravedad) 🔴

### 🔴 Grave — la exclusividad del audio NO está protegida en el backend
`supabase/migrations/0001_init.sql` da a `voices` un `SELECT ... using (true)`, y el
bucket `voices` es **público**. Es decir: cualquier usuario autenticado puede leer
`audio_path` de **todas** las voces y, al ser público el bucket, **reproducir
cualquier audio** construyendo la URL — saltándose el "1 a 1".
- **Arreglo (antes de lanzar):** bucket **privado** + **URLs firmadas** que solo se
  generan para la voz que te ha entregado `claim_voice()`. Y RLS de `voices` que
  solo deje ver las tuyas (enviadas o reclamadas), no todas.

### 🔴 Grave — sin moderación ni reportes
Es una app **anónima de audio**: hay riesgo real de abuso/acoso. Hoy no hay forma de
**reportar** ni **bloquear** una voz/usuario, ni filtrado de contenido.
- **Arreglo:** botón "Reportar", tabla `reports`, ocultar voces reportadas, y a medio
  plazo moderación (revisión manual de reportes y/o transcripción+filtro).
  Las tiendas (App Store/Play) **exigen** esto para contenido generado por usuarios.

### 🟠 Medio — identidad anónima frágil
La sesión es anónima (`signInAnonymously`). Si el usuario **reinstala o borra datos**,
pierde su `@usuario`, voces, racha y reacciones (es otro usuario nuevo).
- **Arreglo:** permitir **vincular** la cuenta (email/Apple/Google) para recuperar
  identidad; mantener el login anónimo como entrada rápida.

### 🟠 Medio — "mandar para recibir" se puede farmear
Se puede mandar audio basura (>1s) para ganar créditos. Hay mínimo de 1s, pero no
calidad.
- **Arreglo:** límites por día, detección de silencio, y la moderación de arriba.

### 🟠 Medio — sin push reales
Solo hay **recordatorio local** diario. No hay "te ha llegado una voz" ni "han
reaccionado" en tiempo real (que es lo que de verdad retiene).
- **Arreglo:** push con `expo-notifications` (tokens) + **Supabase Edge Function**
  que envíe la notificación al reaccionar/entregar.

### 🟡 Bajo — escalabilidad de consultas
- `claim_voice()` usa `ORDER BY random()` sobre toda la tabla → lento con muchos datos
  (mejor muestreo aleatorio acotado).
- La home dispara ~6 consultas en cada foco (créditos, recibidas, racha, novedades,
  pool…) — agrupar en una RPC.
- Listas `received`/`sent` sin paginación (`limit`) — añadir scroll paginado.

### 🟡 Bajo — robustez
- Subida **nativa** (`expo-file-system`) no probada en dispositivo real.
- Muchos `catch(() => {})` silencian errores → sin telemetría no se ven los fallos.
- SDK 56 + React Compiler son muy nuevos (riesgo de bugs de plataforma).

---

## 3. Mejoras de producto (retención/calidad) 🟢

- **Auto-país** por idioma/región del dispositivo (hoy es manual).
- **Realtime**: que la bandeja se actualice sola al llegar una voz (Supabase Realtime).
- **Hilos / "Contestar"** (premium ya señalizado) → monetización.
- **Logros/niveles** más allá de la racha; ranking de "voces que más gustan".
- **Compartir tarjeta** de una voz (imagen) para viralidad real.
- **Accesibilidad**: revisar contraste, tamaños de toque, lectores de pantalla.
- **Tests**: no hay ninguno; al menos pruebas de la capa `lib/` y de `claim_voice`.
- **Telemetría**: PostHog/Amplitude (retención) + Sentry (crashes).

---

## 4. Cómo exportarlo a app real y funcional 🚀

### Paso 1 — Endurecer el backend (imprescindible)
1. Bucket `voices` **privado**; servir audio con **URL firmada** solo al que la reclama.
2. RLS de `voices`: ver solo enviadas/recibidas por ti.
3. Tablas `reports` + UI de reportar/bloquear.
4. (Recomendado) Edge Function para push al reaccionar/entregar.

### Paso 2 — Build nativo con EAS
Ya está `eas.json`. Necesitas cuenta Expo (gratis) y:
```bash
npx eas-cli login
npx eas-cli build --profile production --platform android   # APK/AAB
npx eas-cli build --profile production --platform ios       # requiere Apple Dev
```
- **Android:** cuenta Google Play Developer (pago único 25 $).
- **iOS:** Apple Developer (99 $/año).

### Paso 3 — Secretos y entorno
- Las `EXPO_PUBLIC_*` son **públicas** (van en el cliente) → ok embebidas.
- La **service_role key NUNCA** va en la app ni en el repo (solo en tu máquina/CI
  seguro para el `seed`).
- Mueve config sensible a **EAS Environment Variables** si crece.

### Paso 4 — Publicar
```bash
npx eas-cli submit --platform android
npx eas-cli submit --platform ios
```
Requisitos de tienda que **faltan**: icono (✅ hecho), **capturas**, **descripción**,
**política de privacidad** y **términos** (URL pública), **clasificación por edad**
(con UGC anónimo suele ser 17+), y el **mecanismo de reporte/bloqueo** (Paso 1.3).

### Paso 5 — Operación
- **EAS Update** para parches OTA sin volver a pasar por revisión.
- **Sentry** (crashes) + **analítica** de retención (DAU, D1/D7, embudo de envío).
- Monitorizar Supabase (uso de Storage, filas, rate limits).

---

## 5. Resumen: prioridades antes de lanzar

| Prioridad | Tarea |
|---|---|
| 🔴 1 | Bucket privado + URLs firmadas + RLS de `voices` |
| 🔴 2 | Reportar/bloquear voces (moderación mínima) |
| 🟠 3 | Push reales (Edge Function) |
| 🟠 4 | Vincular cuenta (recuperar identidad) |
| 🟡 5 | Política de privacidad + términos + capturas (tienda) |
| 🟡 6 | Telemetría (Sentry + analítica) |

El MVP **demuestra el producto**; estos pasos lo convierten en una app **publicable
y segura**.
