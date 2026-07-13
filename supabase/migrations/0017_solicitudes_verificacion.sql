-- ecco — solicitudes de verificación (famosos) y cuentas de empresa.
-- El usuario solicita; un admin aprueba y eso concede la insignia (badge).
-- Ejecuta DESPUÉS de 0001–0016. Idempotente.

create table if not exists public.solicitudes_verificacion (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('verificado', 'empresa')),
  enlace text,                 -- prueba: Instagram, web oficial, etc.
  nota text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamptz not null default now()
);

-- Una solicitud pendiente por usuario como mucho.
create unique index if not exists solicitud_pendiente_unica
  on public.solicitudes_verificacion (user_id)
  where estado = 'pendiente';

alter table public.solicitudes_verificacion enable row level security;

drop policy if exists solic_insert_own on public.solicitudes_verificacion;
create policy solic_insert_own on public.solicitudes_verificacion
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists solic_select_own_or_admin on public.solicitudes_verificacion;
create policy solic_select_own_or_admin on public.solicitudes_verificacion
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ── Panel admin: listar pendientes ──
create or replace function public.admin_verificaciones()
returns table (
  id bigint, user_id uuid, username text, tipo text,
  enlace text, nota text, creado_en timestamptz
)
language sql security definer set search_path = public
as $$
  select s.id, s.user_id, p.username, s.tipo, s.enlace, s.nota, s.created_at
  from public.solicitudes_verificacion s
  join public.profiles p on p.id = s.user_id
  where public.is_admin() and s.estado = 'pendiente'
  order by s.created_at asc;
$$;
revoke all on function public.admin_verificaciones() from public;
grant execute on function public.admin_verificaciones() to authenticated;

-- ── Panel admin: aprobar (concede insignia) o rechazar ──
create or replace function public.admin_resolver_verificacion(
  p_id bigint, p_aprobar boolean
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  s public.solicitudes_verificacion;
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;

  select * into s from public.solicitudes_verificacion where id = p_id;
  if not found then return; end if;

  if p_aprobar then
    update public.profiles set badge = s.tipo where id = s.user_id;
    update public.solicitudes_verificacion set estado = 'aprobada' where id = p_id;
  else
    update public.solicitudes_verificacion set estado = 'rechazada' where id = p_id;
  end if;
end;
$$;
revoke all on function public.admin_resolver_verificacion(bigint, boolean) from public;
grant execute on function public.admin_resolver_verificacion(bigint, boolean) to authenticated;
