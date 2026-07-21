-- ecco — robustez del pipeline (P1): reintento de moderación atascada y
-- liberación de voces reclamadas que nunca se escucharon.
--
-- ⚠️ ANTES DE EJECUTAR: sustituye __ANON_KEY__ por LA MISMA clave que pusiste
-- en la migración 0009 (la anon/publishable, que no es secreta).
--
-- Ejecuta DESPUÉS de 0001–0020. Idempotente.

create extension if not exists pg_net;

-- ── 1) Reintentar moderaciones atascadas ──
-- Si la llamada a moderar-audio falló en el momento del envío (red, 5xx de
-- Groq…), la voz se queda 'pendiente' para siempre. Este barrido la re-lanza.
-- La Edge Function es idempotente: reintentar es seguro.
create or replace function public.remoderar_atascadas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
  n integer := 0;
begin
  for v in
    select id from public.voices
    where estado_moderacion = 'pendiente'
      and created_at < now() - interval '5 minutes'
    order by created_at asc
    limit 20                       -- por pasada: evita avalanchas
  loop
    perform net.http_post(
      url := 'https://wgrziufchibgwowfhyhp.supabase.co/functions/v1/moderar-audio',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer __ANON_KEY__'
      ),
      body := jsonb_build_object('audioId', v.id)
    );
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.remoderar_atascadas() from public;

-- ── 2) Liberar claims caducados ──
-- Una voz reclamada y no escuchada en 24 h vuelve al pool: quien la reclamó
-- pierde el acceso (la política de lectura exige claimed_by = tú) y otra
-- persona podrá recibirla.
create or replace function public.liberar_claims_caducados()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.voices
     set claimed_by = null,
         claimed_at = null
   where claimed_by is not null
     and heard_at is null
     and claimed_at < now() - interval '24 hours';
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.liberar_claims_caducados() from public;

-- ── 3) Programación (tolerante si pg_cron no está disponible) ──
do $$
begin
  create extension if not exists pg_cron;

  if exists (select 1 from cron.job where jobname = 'ecco-remoderar') then
    perform cron.unschedule('ecco-remoderar');
  end if;
  perform cron.schedule('ecco-remoderar', '*/10 * * * *',
    'select public.remoderar_atascadas()');

  if exists (select 1 from cron.job where jobname = 'ecco-liberar-claims') then
    perform cron.unschedule('ecco-liberar-claims');
  end if;
  perform cron.schedule('ecco-liberar-claims', '15 * * * *',
    'select public.liberar_claims_caducados()');
exception when others then
  raise notice 'pg_cron no configurado (%): las funciones existen; prográmalas a mano.', sqlerrm;
end
$$;
