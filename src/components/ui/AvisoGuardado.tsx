export function AvisoGuardado({ ok, error }: { ok: boolean; error?: string }) {
  if (!ok && !error) return null
  return (
    <p
      className={`text-sm font-medium text-center ${
        ok ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {ok ? '✓ Guardado correctamente' : error}
    </p>
  )
}
