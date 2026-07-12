# ecco — Estado del proyecto (para retomar)

*Última actualización: sesión de desarrollo. Rama de trabajo: `claude/bold-brahmagupta-h77voi`.*

Enlace de prueba (web): **https://riiichiperezz-design.github.io/bookinghair/**

---

## 1. Qué es ecco
App de **notas de voz anónimas**: cada día sueltas UNA voz al mundo y recibes UNA
de un desconocido de cualquier país. Entrega única (una voz → una persona), se
**escucha solo una vez**, reacciones con emoji, y opción de acompañarla con una
**canción de Spotify**. Objetivo: ritual diario adictivo tipo BeReal.

---

## 2. Qué está HECHO (en el código, desplegado en la rama)

**Producto / bucle**
- Alta anónima + onboarding (@usuario, mapa mundial, gate +17, consentimiento IA opt-in).
- Grabar (máx 30 s) → moderación previa → entra al pool.
- Recibir 1 voz/día, escucha única, reacciones animadas, reportar/bloquear con motivo.
- **Ritual diario**: 1 enviada + 1 recibida al día (reset a medianoche UTC).
- Canción de Spotify: buscador integrado + pre-escucha 30 s + tarjeta "Escuchar" al recibir.
- Pantalla de retención ("vuelve mañana") + racha + recordatorio.
- Mapa 2D interactivo con países etiquetados + búsqueda de país por texto.

**Crecimiento / negocio**
- Referidos con recompensa (invitas → +1 voz extra para los dos).
- Consentimiento de voz para IA en dos niveles (GDPR), revocable.
- Analítica propia de retención (eventos) + panel `/metrics` (admin).

**Infra / backend (Supabase)**
- Auth anónima, RLS en todo, bucket privado + URLs firmadas (10 min).
- Moderación previa **100% Groq** (Whisper + gpt-oss-20b), gratis, server-side.
- Push server-side: reacción, voz abierta, voz aprobada + re-enganche diario (pg_cron).
- Rate-limits (usuario/día, dispositivo/día), throttle en búsqueda de Spotify.
- Borrado GDPR completo (filas + audios de Storage).

**Calidad / plataforma**
- Bilingüe **español/inglés** (detección automática por idioma del dispositivo).
- CI (tests) + deploy automático web (GitHub Pages) y funciones (Supabase).
- Config EAS lista para build móvil.
- Docs: `AUDIT.md`, `AUDITORIA-SEGURIDAD-UX.md`, `MODERACION.md`, `MOBILE.md`, dossier estratégico (PDF).

---

## 3. Qué te toca a TI (pasos externos)

### 3.1 Migraciones pendientes en Supabase (SQL Editor, EN ORDEN)
Pega y ejecuta las que no hayas corrido aún:
- [ ] `0013_cancion_en_voz.sql` — columna de la canción.
- [ ] `0014_un_audio_al_dia.sql` — ritual diario 1/1.
- [ ] `0015_borrado_storage.sql` — borrado GDPR de audios.

*(0001–0012 ya deberían estar aplicadas de sesiones anteriores.)*

### 3.2 Secrets en Supabase (Edge Functions → Secrets)
- [x] `GROQ_API_KEY` — moderación (obligatorio).
- [x] `SPOTIFY_CLIENT_SECRET` — buscador de canciones.
- `OPENAI_API_KEY` — ya NO se usa (se puede borrar).

### 3.3 Ajustes de una vez
- [x] Inicios de sesión anónimos activados (Authentication → Providers).
- [ ] Para ver `/metrics`: pon `rol = 'admin'` en tu fila de `profiles`.
- [ ] (Opcional) Database Webhook o el trigger 0009 ya disparan la moderación.

---

## 4. Siguiente gran paso: la app en el móvil (EAS)
La web es solo preview; el push nativo y el micro real van en el build.
Guía en `MOBILE.md`. Resumen:
```
npm install
npx eas-cli login
npx eas-cli init
npx eas-cli build --profile preview --platform android
```
→ instalas el APK y ecco funciona sola contra tu Supabase.

---

## 5. Pendientes conocidos (no bloquean el lanzamiento)
- **S2**: límite por dispositivo es "blando"; para producción, App Attest / Play
  Integrity o captcha (requiere build nativo).
- **S5 avanzado**: borrado selectivo del dataset — solo si llegas a licenciar voz a IA.
- **Métricas D1/D7/D30 reales** (ahora hay DAU/WAU/MAU + % que envía; falta cohortes).
- **Dominio propio** + restringir CORS a ese dominio final.
- **i18n**: EN/ES cubiertos; añadir más idiomas si se abre a otros mercados.

---

## 6. Orden recomendado hasta septiembre
1. Aplicar migraciones 0013–0015 y probar el ciclo completo en web.
2. **Build EAS** e instalar en tu móvil (probar push + micro nativo).
3. Semilla concentrada (un campus/ciudad) + medir retención en `/metrics`.
4. Cerrar decisiones de marketing del dossier (embajadores, momento héroe).
5. Legal real (privacidad/términos) + revisión de seguridad antes de abrir.

*Referencia estratégica completa: el dossier (PDF) y `AUDITORIA-SEGURIDAD-UX.md`.*
