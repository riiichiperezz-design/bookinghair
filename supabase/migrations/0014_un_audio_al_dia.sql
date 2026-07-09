-- ecco — ritual diario: UNA voz enviada y UNA recibida al día.
-- Ejecuta DESPUÉS de 0001–0013. Idempotente.
--
-- · Enviar: máx 1 voz/día por usuario (y 3/día por dispositivo, anti-multicuenta).
-- · Recibir: máx 1 voz reclamada/día. Necesitas haber mandado la tuya hoy,
--   o gastar una "voz extra" (bonus de referidos).

-- ── Límite de envío: 1/día por usuario ──
create or replace function public.check_voice_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt_user int;
  cnt_dev int;
begin
  select count(*) into cnt_user
  from public.voices
  where sender_id = new.sender_id
    and created_at::date = current_date;
  if cnt_user >= 1 then
    raise exception 'Ya has soltado tu voz de hoy. Mañana sale otra 🔥';
  end if;

  if new.device_id is not null then
    select count(*) into cnt_dev
    from public.voices
    where device_id = new.device_id
      and created_at::date = current_date;
    if cnt_dev >= 3 then
      raise exception 'Demasiadas voces desde este dispositivo hoy. Vuelve mañana.';
    end if;
  end if;

  return new;
end;
$$;

-- ── Reclamo: 1/día; hoy has mandado o gastas una voz extra ──
create or replace function public.claim_voice()
returns public.voices
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  sent_today int;
  v public.voices;
begin
  if me is null then raise exception 'No autenticado'; end if;

  -- Ya recibiste la tuya hoy → mañana más.
  if exists (
    select 1 from public.voices
    where claimed_by = me and claimed_at::date = current_date
  ) then
    return null;
  end if;

  select count(*) into sent_today
  from public.voices
  where sender_id = me and created_at::date = current_date;

  -- Sin voz enviada hoy: intenta gastar una voz extra (bonus de referidos).
  if sent_today = 0 then
    update public.profiles
       set bonus_credits = bonus_credits - 1
     where id = me and bonus_credits > 0;
    if not found then return null; end if;
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

  if not found then
    -- No había voz que darte: devuelve la voz extra si la gastaste.
    if sent_today = 0 then
      update public.profiles
         set bonus_credits = bonus_credits + 1
       where id = me;
    end if;
    return null;
  end if;

  update public.voices set claimed_by = me, claimed_at = now()
  where id = v.id returning * into v;
  return v;
end;
$$;
revoke all on function public.claim_voice() from public;
grant execute on function public.claim_voice() to authenticated;
