# Configuración de Supabase para ecco

Pasos a hacer **una vez** en el panel de Supabase (https://supabase.com/dashboard,
proyecto `wgrziufchibgwowfhyhp`).

## 1. Activar el login anónimo

ecco no tiene login visible: cada dispositivo recibe una sesión anónima automática.

- Ve a **Authentication → Sign In / Providers**.
- Activa **"Allow anonymous sign-ins"** y guarda.

## 2. Crear las tablas, RLS y el bucket de audios

- Ve a **SQL Editor → New query**.
- Pega el contenido de [`migrations/0001_init.sql`](./migrations/0001_init.sql).
- Pulsa **Run**.

Esto crea las tablas `profiles`, `voices`, `voice_views`, `reactions`, sus políticas
de seguridad (RLS) y el bucket público `voices` para los audios.

## 3. Listo

La app ya usa estas tablas mediante la clave pública (`EXPO_PUBLIC_SUPABASE_ANON_KEY`)
que está en tu `.env`. No hace falta nada más.

> Nota: el bucket `voices` es **público** (las URLs son uuids no adivinables) para
> simplificar la reproducción en el MVP. Cuando quieras, lo pasamos a privado con
> URLs firmadas.
