-- ecco — entrega única (1 a 1) + "mandar para recibir"
-- Ejecuta este script DESPUÉS de 0001_init.sql, igual que el anterior:
-- Supabase Dashboard → SQL Editor → New query → pega esto → Run.

-- Marca de quién reclamó cada voz (entrega única).
alter table public.voices
  add column if not exists claimed_by uuid references auth.users on delete set null,
  add column if not exists claimed_at timestamptz;

create index if not exists voices_claimed_by_idx on public.voices (claimed_by);
create index if not exists voices_unclaimed_idx
  on public.voices (claimed_by) where claimed_by is null;

-- Reclama (entrega) una voz aleatoria del pool para el usuario actual.
--   · Cada voz se entrega a UNA sola persona (for update skip locked).
--   · Debes haber enviado más voces de las que has reclamado
--     (mandar para recibir).
-- Devuelve la voz reclamada, o NULL si no tienes crédito o el pool está vacío.
create or replace function public.claim_voice()
returns public.voices
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  sent_count int;
  claimed_count int;
  v public.voices;
begin
  if me is null then
    raise exception 'No autenticado';
  end if;

  select count(*) into sent_count from public.voices where sender_id = me;
  select count(*) into claimed_count from public.voices where claimed_by = me;

  -- Sin créditos: hay que mandar una voz para poder recibir.
  if sent_count <= claimed_count then
    return null;
  end if;

  -- Una voz al azar, no reclamada y que no sea mía. SKIP LOCKED evita que dos
  -- personas reclamen la misma a la vez.
  select * into v
  from public.voices
  where claimed_by is null and sender_id <> me
  order by random()
  limit 1
  for update skip locked;

  if not found then
    return null; -- pool vacío
  end if;

  update public.voices
  set claimed_by = me, claimed_at = now()
  where id = v.id
  returning * into v;

  return v;
end;
$$;

revoke all on function public.claim_voice() from public;
grant execute on function public.claim_voice() to authenticated;
