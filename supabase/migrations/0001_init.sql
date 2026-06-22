-- ecco — esquema inicial
-- Ejecuta este script en: Supabase Dashboard → SQL Editor → New query → Run.
-- Requiere tener activado "Anonymous sign-ins" en Authentication → Sign In / Providers.

-- ───────────────────────────── Tablas ─────────────────────────────

-- Perfil opcional (para más adelante: @username, país).
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  country text,
  created_at timestamptz not null default now()
);

-- Una voz (nota de audio anónima) que va al "pool" para que la descubra otro.
create table if not exists public.voices (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users on delete cascade,
  audio_path text not null,
  duration_ms integer not null default 0,
  country text,
  created_at timestamptz not null default now()
);

-- Registro de voces ya vistas/escuchadas por cada usuario.
create table if not exists public.voice_views (
  voice_id uuid not null references public.voices on delete cascade,
  viewer_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (voice_id, viewer_id)
);

-- Reacción (emoji) de un usuario a una voz. Una por usuario y voz.
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  voice_id uuid not null references public.voices on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (voice_id, user_id)
);

create index if not exists voices_created_at_idx on public.voices (created_at desc);
create index if not exists voices_sender_idx on public.voices (sender_id);

-- ─────────────────────────── RLS (seguridad) ───────────────────────────

alter table public.profiles enable row level security;
alter table public.voices enable row level security;
alter table public.voice_views enable row level security;
alter table public.reactions enable row level security;

-- profiles: cada quien gestiona el suyo; lectura pública.
create policy "profiles read" on public.profiles
  for select using (true);
create policy "profiles upsert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

-- voices: cualquiera autenticado puede leer (para recibir); solo creas las tuyas.
create policy "voices read" on public.voices
  for select to authenticated using (true);
create policy "voices insert own" on public.voices
  for insert to authenticated with check (auth.uid() = sender_id);
create policy "voices delete own" on public.voices
  for delete to authenticated using (auth.uid() = sender_id);

-- voice_views: solo tus propias vistas.
create policy "views read own" on public.voice_views
  for select to authenticated using (auth.uid() = viewer_id);
create policy "views insert own" on public.voice_views
  for insert to authenticated with check (auth.uid() = viewer_id);

-- reactions: lectura pública (para contar); solo creas/editas la tuya.
create policy "reactions read" on public.reactions
  for select using (true);
create policy "reactions insert own" on public.reactions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "reactions update own" on public.reactions
  for update to authenticated using (auth.uid() = user_id);

-- ─────────────────────────── Storage (audios) ───────────────────────────

-- Bucket público para los audios (las rutas son uuids no adivinables).
insert into storage.buckets (id, name, public)
values ('voices', 'voices', true)
on conflict (id) do nothing;

-- Subir: cualquier usuario autenticado en el bucket 'voices'.
create policy "voices storage upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'voices');

-- Leer: público (bucket público).
create policy "voices storage read" on storage.objects
  for select to public using (bucket_id = 'voices');
