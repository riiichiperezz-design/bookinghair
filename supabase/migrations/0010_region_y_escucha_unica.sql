-- ecco — región aproximada en el perfil + "escucha única" de las voces.
-- Ejecuta DESPUÉS de 0001–0009. Idempotente.

-- ── Región/ciudad aproximada (opcional, además del país) ──
alter table public.profiles add column if not exists region text;

-- ── Escucha única: una voz reclamada solo se puede oír una vez ──
alter table public.voices add column if not exists heard_at timestamptz;

-- Marca una voz como escuchada (solo quien la reclamó, y solo la primera vez).
-- SECURITY DEFINER para no abrir un UPDATE genérico por RLS.
create or replace function public.mark_heard(p_voice uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then return; end if;
  update public.voices
     set heard_at = now()
   where id = p_voice
     and claimed_by = me
     and heard_at is null;
end;
$$;
revoke all on function public.mark_heard(uuid) from public;
grant execute on function public.mark_heard(uuid) to authenticated;
