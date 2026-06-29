-- ecco — límite por dispositivo (además del límite por usuario)
-- Ejecuta DESPUÉS de 0001–0007. Idempotente.

alter table public.voices add column if not exists device_id text;
create index if not exists voices_device_idx on public.voices (device_id);

-- Rate limit reforzado: por usuario y por dispositivo (mitiga el abuso de crear
-- muchas cuentas anónimas desde el mismo aparato).
-- Nota: device_id lo aporta el cliente, así que es un límite "blando" pero sube
-- el listón. El control fuerte (captcha/attestation) queda como mejora futura.
create or replace function public.check_voice_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt_user int;
  cnt_dev int;
  lim_user constant int := 30; -- voces/24h por usuario
  lim_dev  constant int := 40; -- voces/24h por dispositivo
begin
  select count(*) into cnt_user
  from public.voices
  where sender_id = new.sender_id
    and created_at > now() - interval '24 hours';
  if cnt_user >= lim_user then
    raise exception 'Has alcanzado el límite diario de voces. Vuelve mañana.';
  end if;

  if new.device_id is not null then
    select count(*) into cnt_dev
    from public.voices
    where device_id = new.device_id
      and created_at > now() - interval '24 hours';
    if cnt_dev >= lim_dev then
      raise exception 'Demasiadas voces desde este dispositivo hoy. Vuelve mañana.';
    end if;
  end if;

  return new;
end;
$$;
