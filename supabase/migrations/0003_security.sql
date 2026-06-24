-- ecco — seguridad del audio (entrega 1 a 1 protegida de verdad)
-- Ejecuta DESPUÉS de 0001 y 0002.

-- 1) El bucket pasa a PRIVADO.
update storage.buckets set public = false where id = 'voices';

-- 2) Fuera la lectura pública del Storage.
drop policy if exists "voices storage read" on storage.objects;

-- 3) Solo puedes leer (firmar) el audio de una voz que sea tuya
--    (la enviaste tú) o que te hayan entregado (la reclamaste).
create policy "voices storage read own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'voices'
    and exists (
      select 1 from public.voices v
      where v.audio_path = storage.objects.name
        and (v.sender_id = auth.uid() or v.claimed_by = auth.uid())
    )
  );

-- 4) RLS estricto en la tabla: solo ves tus voces (enviadas o reclamadas).
--    Así nadie puede enumerar audio_path de voces ajenas.
drop policy if exists "voices read" on public.voices;
create policy "voices read own" on public.voices
  for select to authenticated
  using (sender_id = auth.uid() or claimed_by = auth.uid());

-- 5) El pool (voces sin reclamar) ya no es visible por RLS, así que el
--    contador "voces dando vueltas" se calcula con una función segura.
create or replace function public.waiting_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.voices where claimed_by is null;
$$;

revoke all on function public.waiting_count() from public;
grant execute on function public.waiting_count() to authenticated;
