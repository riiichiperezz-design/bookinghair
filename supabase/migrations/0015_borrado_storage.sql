-- ecco — derecho al borrado (GDPR): el usuario puede eliminar SUS audios del
-- bucket privado (su carpeta {uid}/...). "Borrar mis datos" en la app los
-- elimina de Storage además de las filas.
-- Ejecuta DESPUÉS de 0001–0014. Idempotente.

drop policy if exists "voices storage delete own" on storage.objects;
create policy "voices storage delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'voices'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
