-- ecco — disparo automático de la moderación en el servidor (sin depender del
-- cliente). Alternativa a los "Database Webhooks" de la UI: usa pg_net
-- directamente (ya activo en 0005 para el push), así no necesita el esquema
-- interno supabase_functions.
--
-- Cada vez que se INSERTA una voz 'pendiente', llama a la Edge Function
-- moderar-audio. La función es idempotente, así que reintentar es seguro.
--
-- ⚠️ ANTES DE EJECUTAR: sustituye __ANON_KEY__ por tu clave **anon/publishable**
-- (Settings → API → Project API keys → `anon` `public`). Esa clave NO es secreta
-- (va embebida en la app), por eso es segura aquí. NO uses la `service_role`.
--
-- Ejecuta DESPUÉS de 0001–0008. Idempotente.

create extension if not exists pg_net;

create or replace function public.on_voice_insert_moderate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado_moderacion is distinct from 'pendiente' then
    return new;
  end if;

  perform net.http_post(
    url := 'https://wgrziufchibgwowfhyhp.supabase.co/functions/v1/moderar-audio',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer __ANON_KEY__'
    ),
    body := jsonb_build_object('audioId', new.id)
  );
  return new;
end;
$$;

drop trigger if exists trg_voice_moderate on public.voices;
create trigger trg_voice_moderate
  after insert on public.voices
  for each row execute function public.on_voice_insert_moderate();
