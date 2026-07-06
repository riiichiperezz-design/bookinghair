-- ecco — referidos con recompensa, consentimiento de voz para IA y eventos
-- de retención. Ejecuta DESPUÉS de 0001–0010. Idempotente.

-- ── Columnas nuevas en profiles ──
alter table public.profiles add column if not exists bonus_credits int not null default 0;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);
alter table public.profiles add column if not exists consent_voice_ai boolean not null default false;
alter table public.profiles add column if not exists consent_updated_at timestamptz;

-- ── Referidos: canjear un código (= @usuario del que invita) ──
-- Recompensa: +1 crédito bonus para el nuevo usuario y para quien invitó.
-- Solo una vez por usuario (referred_by se fija una sola vez).
create or replace function public.redeem_referral(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  ref_id uuid;
begin
  if me is null or p_code is null or length(trim(p_code)) = 0 then
    return false;
  end if;

  select id into ref_id
  from public.profiles
  where lower(username) = lower(trim(p_code))
  limit 1;

  if ref_id is null or ref_id = me then
    return false;
  end if;

  update public.profiles
     set referred_by = ref_id
   where id = me and referred_by is null;
  if not found then
    return false; -- ya tenía referidor: no se recompensa de nuevo
  end if;

  update public.profiles
     set bonus_credits = coalesce(bonus_credits, 0) + 1
   where id in (me, ref_id);

  return true;
end;
$$;
revoke all on function public.redeem_referral(text) from public;
grant execute on function public.redeem_referral(text) to authenticated;

-- ── Consentimiento de voz para IA (opt-in explícito y separado) ──
create or replace function public.set_voice_ai_consent(p_value boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then return; end if;
  update public.profiles
     set consent_voice_ai = coalesce(p_value, false),
         consent_updated_at = now()
   where id = me;
end;
$$;
revoke all on function public.set_voice_ai_consent(boolean) from public;
grant execute on function public.set_voice_ai_consent(boolean) to authenticated;

-- ── claim_voice: los créditos ahora incluyen los bonus (referidos) ──
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
  bonus int;
  v public.voices;
begin
  if me is null then raise exception 'No autenticado'; end if;

  select count(*) into sent_count from public.voices where sender_id = me;
  select count(*) into claimed_count from public.voices where claimed_by = me;
  select coalesce(bonus_credits, 0) into bonus from public.profiles where id = me;

  if (sent_count + coalesce(bonus, 0)) <= claimed_count then
    return null;
  end if;

  select * into v
  from public.voices vo
  where vo.claimed_by is null
    and vo.estado_moderacion = 'aprobado'
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

-- ── Eventos de retención (analítica propia, mínima) ──
create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
alter table public.eventos enable row level security;

drop policy if exists eventos_insert_own on public.eventos;
create policy eventos_insert_own on public.eventos
  for insert to authenticated
  with check (user_id = auth.uid());

-- Lectura solo para admin (las métricas se consultan desde el panel/SQL).
drop policy if exists eventos_select_admin on public.eventos;
create policy eventos_select_admin on public.eventos
  for select to authenticated
  using (public.is_admin());

create index if not exists eventos_tipo_idx on public.eventos (tipo, created_at desc);
create index if not exists eventos_user_idx on public.eventos (user_id, created_at desc);
