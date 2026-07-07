-- ecco — canción de Spotify opcional acompañando a una voz.
-- Ejecuta DESPUÉS de 0001–0012. Idempotente.
-- Estructura de song (jsonb): { id, title, artist, url, image }
alter table public.voices add column if not exists song jsonb;
