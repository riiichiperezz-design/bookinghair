# Configuración de Supabase para ecco

Pasos a hacer **una vez** en el panel de Supabase (https://supabase.com/dashboard,
proyecto `wgrziufchibgwowfhyhp`).

## 1. Activar el login anónimo

ecco no tiene login visible: cada dispositivo recibe una sesión anónima automática.

- Ve a **Authentication → Sign In / Providers**.
- Activa **"Allow anonymous sign-ins"** y guarda.

## 2. Crear las tablas, RLS y el bucket de audios

En **SQL Editor → New query**, ejecuta **en orden** estos dos scripts (pega cada
uno, pulsa **Run**, y luego el siguiente):

1. [`migrations/0001_init.sql`](./migrations/0001_init.sql) — tablas base
   (`profiles`, `voices`, `voice_views`, `reactions`), RLS y bucket `voices`.
2. [`migrations/0002_claim.sql`](./migrations/0002_claim.sql) — entrega única
   (1 a 1) y `claim_voice()` ("mandar para recibir").
3. [`migrations/0003_security.sql`](./migrations/0003_security.sql) — bucket
   **privado** + URLs firmadas + RLS estricto (protege la exclusividad).
4. [`migrations/0004_moderation.sql`](./migrations/0004_moderation.sql) —
   reportar/bloquear y filtrado en `claim_voice()`.
5. [`migrations/0005_push.sql`](./migrations/0005_push.sql) — notificaciones
   push reales vía `pg_net` (solo afectan a builds nativos).
6. [`migrations/0006_moderacion_previa.sql`](./migrations/0006_moderacion_previa.sql)
   — **moderación previa**: estado de los audios, cola de revisión, incidencias,
   y `claim_voice()` que solo entrega audios **aprobados**.

Ejecuta en orden las que aún no hayas pasado.

## 5. Moderación previa (Edge Function)

Ningún audio se entrega sin pasar por moderación. La función vive en
[`functions/moderar-audio`](./functions/moderar-audio).

**Opción A — automática (recomendada):** hay un workflow
(`.github/workflows/deploy-functions.yml`) que despliega la función en cada push.
Solo tienes que añadir **una vez** el secreto del repositorio:

- Genera un token en https://supabase.com/dashboard/account/tokens
- Repo → **Settings → Secrets and variables → Actions → New repository secret**
  → nombre `SUPABASE_ACCESS_TOKEN`, valor = el token.

**Opción B — manual con la CLI:**
1. Instala la CLI: `npm i -g supabase` y entra: `supabase login`.
2. Vincula tu proyecto: `supabase link --project-ref wgrziufchibgwowfhyhp`.
3. Despliega: `supabase functions deploy moderar-audio`.

Por defecto usa el **ModeradorStub** (aprueba; solo desarrollo). Para activar el
moderador real, implementa `moderador-api.ts` y pon el secreto:

```bash
supabase secrets set MODERADOR_IMPL=api \
  MODERACION_TRANSCRIPCION_API_KEY=... \
  MODERACION_CLASIFICADOR_API_KEY=...
```

### Hacerte administrador (para el panel de revisión)

En el SQL Editor, con tu user id (lo ves en Authentication → Users):

```sql
update public.profiles set rol = 'admin' where id = 'TU_USER_ID';
```

Luego, en la app, en tu perfil aparecerá **"Panel de moderación"**.

## 3. Listo

La app ya usa estas tablas mediante la clave pública (`EXPO_PUBLIC_SUPABASE_ANON_KEY`)
que está en tu `.env`. No hace falta nada más.

> Nota: el bucket `voices` es **público** (las URLs son uuids no adivinables) para
> simplificar la reproducción en el MVP. Cuando quieras, lo pasamos a privado con
> URLs firmadas.

## 4. (Opcional) Cargar voces de prueba

Para probar el flujo de recibir/reaccionar sin necesitar dos cuentas, hay un
script que crea unos usuarios demo y sube una voz de cada uno al pool.

1. Copia tu **service_role key**: Supabase → **Project Settings → API** →
   `service_role` (es **secreta**, no la subas a git ni la compartas).
2. En la carpeta del proyecto:

   **Windows (PowerShell):**
   ```powershell
   $env:SUPABASE_SERVICE_ROLE_KEY="pega_aqui_la_service_role"
   npm run seed
   ```
   **Mac/Linux:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY="pega_aqui_la_service_role" npm run seed
   ```

Luego, en la app: **manda una voz** (para tener crédito) y pulsa **"Abrir mis
voces"** → recibirás una de los usuarios demo y podrás reaccionar.
