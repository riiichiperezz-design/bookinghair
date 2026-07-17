-- ecco — el push de reacción ya no muestra la clave cruda de la reacción
-- (ahora son 'me_llega' / 'vibra' / 'jajaja' / 'crack', no emojis).
-- Ejecuta DESPUÉS de 0001–0017. Idempotente.

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
    '🔥 Han reaccionado a tu voz',
    'Alguien ha sentido lo que mandaste.'
  );
  return new;
end;
$$;
