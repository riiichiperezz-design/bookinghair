export function Spinner({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-gray-50">
      <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{texto}</p>
    </div>
  )
}

export function SpinnerInline() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-7 h-7 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
