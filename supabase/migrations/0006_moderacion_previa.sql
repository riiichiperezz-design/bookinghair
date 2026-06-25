-- ecco — MODERACIÓN PREVIA (ningún audio se entrega sin aprobar)
-- Ejecuta DESPUÉS de 0001–0005. Es idempotente.

-- ─────────────── 1) Estado de moderación en los audios ───────────────
alter table public.voices
  add column if not exists estado_moderacion text not null default 'pendiente',
  add column if not exists motivo_moderacion text,
  add column if not exists transcripcion text,
  add column if not exists moderado_en timestamptz;

do $$ begin
  alter table public.voices
    add constraint voices_estado_moderacion_chk
    check (estado_moderacion in ('pendiente','aprobado','rechazado','revision_humana'));
exception when duplicate_object then null; end $$;

-- Grandfather: los audios que ya existían (datos de prueba previos a la
-- moderación) se dan por aprobados. Los NUEVOS nacen 'pendiente' por defecto.
update public.voices
  set estado_moderacion = 'aprobado'
  where moderado_en is null and estado_moderacion = 'pendiente'
    and created_at < now();

create index if not exists voices_estado_idx on public.voices (estado_moderacion);
create index if not exists voices_pool_idx
  on public.voices (claimed_by) where claimed_by is null;

-- Rol para administradores/moderadores.
alter table public.profiles
  add column if not exists rol text not null default 'user';

-- ─────────────── 2) Cola de revisión humana ───────────────
create table if not exists public.cola_moderacion (
  id uuid primary key default gen_random_uuid(),
  audio_id uuid not null references public.voices on delete cascade,
  motivo text,
  estado text not null default 'abierto' check (estado in ('abierto','resuelto')),
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz,
  resuelto_por uuid references auth.users on delete set null
);
create index if not exists cola_estado_idx on public.cola_moderacion (estado);

-- ─────────────── 3) Incidencias (reportes de usuarios) ───────────────
create table if not exists public.incidencias (
  id uuid primary key default gen_random_uuid(),
  audio_id uuid not null references public.voices on delete cascade,
  reportante_id uuid not null references auth.users on delete cascade,
  motivo text,
  estado text not null default 'abierto' check (estado in ('abierto','resuelto')),
  creado_en timestamptz not null default now(),
  unique (audio_id, reportante_id)
);
create index if not exists incidencias_audio_idx on public.incidencias (audio_id);

alter table public.cola_moderacion enable row level security;
alter table public.incidencias enable row level security;

-- incidencias: el usuario solo puede crear las suyas. La lectura es vía RPC admin.
drop policy if exists "incidencias insert own" on public.incidencias;
create policy "incidencias insert own" on public.incidencias
  for insert to authenticated with check (auth.uid() = reportante_id);

-- cola_moderacion: nadie la lee directamente (solo rol de servicio y RPC admin).

-- ─────────────── 4) is_admin() ───────────────
create or replace function public.is_admin()
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and rol = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ─────────────── 5) Storage: los admins pueden firmar audios para revisarlos ───────────────
drop policy if exists "voices storage admin read" on storage.objects;
create policy "voices storage admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'voices' and public.is_admin());

-- ─────────────── 6) RLS: solo el autor (y servicio/admin) ve los no aprobados ───────────────
-- La política "voices read own" (0003) ya limita a sender_id/claimed_by = uid,
-- así que un tercero nunca ve audios pendientes/rechazados ajenos. Añadimos
-- que el admin pueda leer la fila (para el panel) sin abrir nada más.
drop policy if exists "voices read admin" on public.voices;
create policy "voices read admin" on public.voices
  for select to authenticated using (public.is_admin());

-- ─────────────── 7) REPARTO: solo se entregan audios APROBADOS ───────────────
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
  if me is null then raise exception 'No autenticado'; end if;

  select count(*) into sent_count from public.voices where sender_id = me;
  select count(*) into claimed_count from public.voices where claimed_by = me;
  if sent_count <= claimed_count then return null; end if;

  select * into v
  from public.voices vo
  where vo.claimed_by is null
    and vo.estado_moderacion = 'aprobado'            -- ← innegociable
    and vo.sender_id <> me
    and vo.sender_id not in (
      select blocked_id from public.blocks where blocker_id = me
    )
    and vo.id not in (
      select audio_id from public.incidencias where reportante_id = me
    )
    and vo.id not in (
      select audio_id from public.incidencias group by audio_id having count(*) >= 3
    )
  order by random()
  limit 1
  for update skip locked;

  if not found then return null; end if;

  update public.voices set claimed_by = me, claimed_at = now()
  where id = v.id returning * into v;
  return v;
end;
$$;
revoke all on function public.claim_voice() from public;
grant execute on function public.claim_voice() to authenticated;

-- ─────────────── 8) RPCs del panel de moderación (solo admin) ───────────────
create or replace function public.admin_queue()
returns table (
  audio_id uuid, audio_path text, motivo text,
  transcripcion text, estado_moderacion text, creado_en timestamptz
)
language sql security definer
set search_path = public
as $$
  select c.audio_id, v.audio_path, c.motivo, v.transcripcion,
         v.estado_moderacion, c.creado_en
  from public.cola_moderacion c
  join public.voices v on v.id = c.audio_id
  where public.is_admin() and c.estado = 'abierto'
  order by c.creado_en asc;
$$;
revoke all on function public.admin_queue() from public;
grant execute on function public.admin_queue() to authenticated;

create or replace function public.admin_incidencias()
returns table (
  audio_id uuid, audio_path text, transcripcion text,
  estado_moderacion text, num int, ultimo timestamptz
)
language sql security definer
set search_path = public
as $$
  select i.audio_id, v.audio_path, v.transcripcion, v.estado_moderacion,
         count(*)::int as num, max(i.creado_en) as ultimo
  from public.incidencias i
  join public.voices v on v.id = i.audio_id
  where public.is_admin() and i.estado = 'abierto'
  group by i.audio_id, v.audio_path, v.transcripcion, v.estado_moderacion
  order by max(i.creado_en) desc;
$$;
revoke all on function public.admin_incidencias() from public;
grant execute on function public.admin_incidencias() to authenticated;

create or replace function public.admin_resolve(p_audio_id uuid, p_decision text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  if p_decision not in ('aprobado','rechazado') then
    raise exception 'Decisión inválida';
  end if;

  update public.voices
    set estado_moderacion = p_decision, moderado_en = now()
    where id = p_audio_id;

  update public.cola_moderacion
    set estado = 'resuelto', resuelto_en = now(), resuelto_por = auth.uid()
    where audio_id = p_audio_id and estado = 'abierto';

  update public.incidencias
    set estado = 'resuelto'
    where audio_id = p_audio_id and estado = 'abierto';
end;
$$;
revoke all on function public.admin_resolve(uuid, text) from public;
grant execute on function public.admin_resolve(uuid, text) to authenticated;
