-- ecco — push server-side extra + panel de métricas de retención.
-- Ejecuta DESPUÉS de 0001–0011. Idempotente.
-- (Los push de "han abierto tu voz" y "reaccionaron" ya existen en 0005.)

-- ─────────────────────── 1) Push al aprobarse tu voz ───────────────────────
-- Cuando la moderación aprueba una voz, avisamos a quien la envió.
create or replace function public.on_voice_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tok text;
begin
  if new.estado_moderacion = 'aprobado'
     and old.estado_moderacion is distinct from 'aprobado' then
    select push_token into tok from public.profiles where id = new.sender_id;
    perform public.send_push(
      tok,
      '🌍 Tu voz ya está dando vueltas',
      'La escuchará un desconocido del mundo. Te avisamos cuando la abran.'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_voice_approved on public.voices;
create trigger trg_voice_approved
  after update on public.voices
  for each row execute function public.on_voice_approved();

-- ─────────────── 2) Re-enganche diario a usuarios que se enfrían ───────────────
-- Envía un push a usuarios con token que llevan entre ~1 y 14 días sin abrir.
create or replace function public.push_reengagement()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt int := 0;
  r record;
  ultimo timestamptz;
begin
  for r in
    select id, push_token from public.profiles
    where push_token is not null and push_token <> ''
  loop
    select max(created_at) into ultimo
    from public.eventos where user_id = r.id and tipo = 'app_open';

    if ultimo is null
       or (ultimo < now() - interval '20 hours'
           and ultimo > now() - interval '14 days') then
      perform public.send_push(
        r.push_token,
        '🔥 Alguien del mundo quiere oírte',
        'Tienes voces esperando en ecco. Suelta una y descubre la de un desconocido.'
      );
      cnt := cnt + 1;
    end if;
  end loop;
  return cnt;
end;
$$;

-- Programa el re-enganche a las 18:00 (UTC) con pg_cron, si está disponible.
-- Si el proyecto no tiene pg_cron, la migración NO falla: la función queda
-- creada y se puede programar a mano más tarde.
do $$
begin
  create extension if not exists pg_cron;
  if exists (select 1 from cron.job where jobname = 'ecco-reengage') then
    perform cron.unschedule('ecco-reengage');
  end if;
  perform cron.schedule('ecco-reengage', '0 18 * * *',
    'select public.push_reengagement()');
exception when others then
  raise notice 'pg_cron no configurado (%): la funcion push_reengagement existe; prográmala a mano.', sqlerrm;
end
$$;

-- ─────────────────────── 3) Métricas (solo admin) ───────────────────────
-- Devuelve un jsonb con los KPIs de retención. Vacío si no eres admin.
create or replace function public.admin_metrics()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select case when not public.is_admin() then '{}'::jsonb else jsonb_build_object(
    'usuarios',       (select count(*) from public.profiles where username is not null),
    'dau',            (select count(distinct user_id) from public.eventos where tipo='app_open' and created_at::date = current_date),
    'wau',            (select count(distinct user_id) from public.eventos where tipo='app_open' and created_at > now()-interval '7 days'),
    'mau',            (select count(distinct user_id) from public.eventos where tipo='app_open' and created_at > now()-interval '30 days'),
    'enviadas_hoy',   (select count(*) from public.voices where created_at::date = current_date),
    'enviadas_7d',    (select count(*) from public.voices where created_at > now()-interval '7 days'),
    'reclamadas_7d',  (select count(*) from public.voices where claimed_at > now()-interval '7 days'),
    'reacciones_7d',  (select count(*) from public.eventos where tipo='reaction' and created_at > now()-interval '7 days'),
    'pct_envia_7d',   (
      select case when w = 0 then 0 else round(100.0 * s / w) end
      from (
        select
          (select count(distinct user_id) from public.eventos where tipo='app_open'  and created_at > now()-interval '7 days') w,
          (select count(distinct user_id) from public.eventos where tipo='voice_sent' and created_at > now()-interval '7 days') s
      ) q
    ),
    'serie', (
      select coalesce(jsonb_agg(
               jsonb_build_object('dia', to_char(g.d, 'DD/MM'), 'activos', ea.a, 'enviadas', ev.e)
               order by g.d), '[]'::jsonb)
      from generate_series(current_date - 6, current_date, interval '1 day') g(d)
      left join lateral (
        select count(distinct user_id) a from public.eventos
        where tipo='app_open' and created_at::date = g.d::date
      ) ea on true
      left join lateral (
        select count(*) e from public.voices where created_at::date = g.d::date
      ) ev on true
    )
  ) end;
$$;
revoke all on function public.admin_metrics() from public;
grant execute on function public.admin_metrics() to authenticated;
