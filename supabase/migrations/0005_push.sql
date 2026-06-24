-- ecco — notificaciones push reales (vía pg_net → Expo Push API)
-- Ejecuta DESPUÉS de 0001–0004.
-- Nota: el push solo llega a builds nativos (no a Expo Go ni web) y requiere
-- haber hecho `eas init` (projectId) para obtener el token.

create extension if not exists pg_net;

alter table public.profiles add column if not exists push_token text;

-- Envía un push a un Expo push token (no-op si no hay token).
create or replace function public.send_push(token text, title text, body text)
returns void
language plpgsql
security definer
as $$
begin
  if token is null or token = '' then return; end if;
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'to', token,
      'title', title,
      'body', body,
      'sound', 'default'
    )
  );
end;
$$;

-- Al reaccionar → avisa al autor de la voz.
create or replace function public.on_reaction_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tok text;
begin
  select p.push_token into tok
  from public.voices v
  join public.profiles p on p.id = v.sender_id
  where v.id = new.voice_id;

  perform public.send_push(
    tok,
    'Han reaccionado a tu voz',
    new.emoji || ' alguien ha sentido tu voz'
  );
  return new;
end;
$$;

drop trigger if exists trg_reaction_push on public.reactions;
create trigger trg_reaction_push
  after insert on public.reactions
  for each row execute function public.on_reaction_insert();

-- Al abrir (reclamar) tu voz → te avisa.
create or replace function public.on_voice_claimed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tok text;
begin
  if new.claimed_by is not null and old.claimed_by is null then
    select push_token into tok from public.profiles where id = new.sender_id;
    perform public.send_push(tok, 'Tu voz ha llegado', 'Alguien acaba de abrirla 🔥');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_voice_claimed on public.voices;
create trigger trg_voice_claimed
  after update on public.voices
  for each row execute function public.on_voice_claimed();
