-- ecco — blindaje de la ESCUCHA ÚNICA en el servidor (+2 endurecimientos).
-- Hasta ahora la escucha única la garantizaba solo la interfaz; con esto es
-- imposible re-escuchar aunque se modifique el cliente.
-- Ejecuta DESPUÉS de 0001–0019. Idempotente.

-- ── 1) Leer audio SOLO el receptor y SOLO antes de escucharlo ──
-- Sustituye a "voices storage read own" (0003), que permitía al emisor
-- releer siempre y al receptor re-firmar la URL tras heard_at.
-- La política de admin (0006) sigue intacta para moderación.
drop policy if exists "voices storage read own" on storage.objects;
drop policy if exists "voices storage read once" on storage.objects;
create policy "voices storage read once" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'voices'
    and exists (
      select 1 from public.voices v
      where v.audio_path = storage.objects.name
        and v.claimed_by = auth.uid()
        and v.heard_at is null
    )
  );

-- ── 2) Subir solo a TU carpeta (la de borrar ya lo exigía; la de subir no) ──
drop policy if exists "voices storage upload" on storage.objects;
drop policy if exists "voices storage upload own" on storage.objects;
create policy "voices storage upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'voices'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── 3) Validar la canción adjunta (solo enlaces reales de Spotify) ──
-- Evita que un cliente modificado cuele una URL arbitraria que otro usuario
-- abriría al pulsar "Escuchar".
alter table public.voices drop constraint if exists voices_song_url_spotify;
alter table public.voices add constraint voices_song_url_spotify
  check (
    song is null
    or (song->>'url') is null
    or (song->>'url') like 'https://open.spotify.com/%'
  ) not valid;
-- NOT VALID: no re-escanea filas antiguas; aplica a inserciones nuevas.
