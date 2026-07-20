-- ecco — lista de espera (waitlist) para la beta.
-- La landing pública (lista.html) inserta emails con la clave publishable.
-- Ejecuta DESPUÉS de 0001–0018. Idempotente.

create table if not exists public.lista_espera (
  id bigint generated always as identity primary key,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  fuente text,                         -- de dónde vino (landing, instagram, tiktok…)
  created_at timestamptz not null default now()
);

-- Un email, una vez.
create unique index if not exists lista_espera_email_unica
  on public.lista_espera (lower(email));

alter table public.lista_espera enable row level security;

-- Cualquiera puede APUNTARSE (insert), nadie puede leer la lista salvo admin.
drop policy if exists lista_insert_any on public.lista_espera;
create policy lista_insert_any on public.lista_espera
  for insert to anon, authenticated
  with check (true);

grant insert on public.lista_espera to anon, authenticated;

-- Panel admin: ver la lista (solo admin).
create or replace function public.admin_lista_espera()
returns table (email text, fuente text, creado_en timestamptz)
language sql security definer set search_path = public
as $$
  select email, fuente, created_at
  from public.lista_espera
  where public.is_admin()
  order by created_at desc;
$$;
revoke all on function public.admin_lista_espera() from public;
grant execute on function public.admin_lista_espera() to authenticated;

-- Cuántos van (público, para mostrar "X personas ya dentro"). Solo devuelve el total.
create or replace function public.lista_espera_total()
returns integer
language sql security definer set search_path = public
as $$
  select count(*)::int from public.lista_espera;
$$;
revoke all on function public.lista_espera_total() from public;
grant execute on function public.lista_espera_total() to anon, authenticated;
