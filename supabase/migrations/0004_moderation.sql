-- ecco — reportar y bloquear (moderación mínima)
-- Ejecuta DESPUÉS de 0001–0003.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  voice_id uuid not null references public.voices on delete cascade,
  reporter_id uuid not null references auth.users on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (voice_id, reporter_id)
);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users on delete cascade,
  blocked_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create index if not exists reports_voice_idx on public.reports (voice_id);

alter table public.reports enable row level security;
alter table public.blocks enable row level security;

create policy "reports insert own" on public.reports
  for insert to authenticated with check (auth.uid() = reporter_id);
create policy "reports read own" on public.reports
  for select to authenticated using (auth.uid() = reporter_id);

create policy "blocks all own" on public.blocks
  for all to authenticated
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

-- claim_voice con moderación: excluye bloqueados, lo que ya reportaste y
-- las voces con 3+ reportes.
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
    and vo.sender_id <> me
    and vo.sender_id not in (
      select blocked_id from public.blocks where blocker_id = me
    )
    and vo.id not in (
      select voice_id from public.reports where reporter_id = me
    )
    and vo.id not in (
      select voice_id from public.reports group by voice_id having count(*) >= 3
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
