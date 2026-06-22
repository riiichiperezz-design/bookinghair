export function ErrorAviso({ mensaje }: { mensaje?: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 text-red-700 text-sm text-center">
      {mensaje ?? 'Algo ha ido mal. Comprueba tu conexión e inténtalo de nuevo.'}
    </div>
  )
}
