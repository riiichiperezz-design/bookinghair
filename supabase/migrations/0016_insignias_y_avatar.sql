-- ecco — insignias (verificado / empresa), foto de perfil y blindaje de columnas.
-- Ejecuta DESPUÉS de 0001–0015. Idempotente.

-- ── Columnas nuevas ──
alter table public.profiles add column if not exists badge text
  check (badge in ('verificado', 'empresa'));   -- null = usuario normal
alter table public.profiles add column if not exists avatar_url text;

-- ── Blindaje: el cliente NO puede tocar badge/verificado/rol/bonus_credits ──
-- (si no, cualquiera se pondría la insignia azul o créditos). Solo se pueden
-- escribir estas columnas desde la app; el resto, solo por RPC/servicio.
revoke insert on public.profiles from authenticated, anon;
revoke update on public.profiles from authenticated, anon;
grant insert (id, username, country, region, avatar_url, push_token)
  on public.profiles to authenticated;
grant update (username, country, region, avatar_url, push_token)
  on public.profiles to authenticated;

-- Conceder insignia (solo admin, desde el panel o SQL editor con service role):
--   update public.profiles set badge = 'verificado' where username = 'jbalvin';
--   update public.profiles set badge = 'empresa'    where username = 'dominos_es';

-- ── Bucket público de avatares (lectura pública, escritura solo tu carpeta) ──
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars write own" on storage.objects;
create policy "avatars write own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
