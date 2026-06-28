-- ecco — anti-abuso (rate limiting) + conservación de evidencia (CSAM)
-- Ejecuta DESPUÉS de 0001–0006. Idempotente.

-- ─────────────── 1) Límite de envíos por usuario y día ───────────────
-- Evita farmeo/spam de voces. El rol de servicio (seed) también lo respeta;
-- súbelo si necesitas sembrar más.
create or replace function public.check_voice_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt int;
  limite constant int := 30; -- voces por 24 h
begin
  select count(*) into cnt
  from public.voices
  where sender_id = new.sender_id
    and created_at > now() - interval '24 hours';

  if cnt >= limite then
    raise exception 'Has alcanzado el límite diario de voces. Vuelve mañana.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_voice_rate on public.voices;
create trigger trg_voice_rate
  before insert on public.voices
  for each row execute function public.check_voice_rate_limit();

-- ─────────────── 2) Evidencia de moderación (obligaciones legales) ───────────────
-- Cuando la categoría exige conservar evidencia (p. ej. explotación sexual
-- infantil), la Edge Function guarda aquí una copia de los metadatos para el
-- procedimiento legal, aunque la voz se rechace/elimine después.
create table if not exists public.moderacion_evidencia (
  id uuid primary key default gen_random_uuid(),
  audio_id uuid references public.voices on delete set null,
  categoria text,
  transcripcion text,
  audio_path text,
  creado_en timestamptz not null default now()
);

alter table public.moderacion_evidencia enable row level security;
-- Sin políticas: RLS deniega a todos por defecto. Solo accesible con rol de
-- servicio (Edge Function) o consultas administrativas en el panel de Supabase.

create index if not exists evidencia_creado_idx
  on public.moderacion_evidencia (creado_en desc);
