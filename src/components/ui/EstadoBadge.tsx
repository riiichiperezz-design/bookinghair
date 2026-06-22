import type { CitaEstado } from '../../types'

const config: Record<CitaEstado, { label: string; className: string }> = {
  pending:   { label: 'Pendiente',      className: 'bg-gray-100 text-gray-600' },
  confirmed: { label: 'Confirmada',     className: 'bg-green-100 text-green-700' },
  done:      { label: 'Hecha',          className: 'bg-green-200 text-green-800' },
  cancelled: { label: 'Cancelada',      className: 'bg-gray-200 text-gray-500' },
  no_show:   { label: 'No se presentó', className: 'bg-red-100 text-red-600' },
}

export function EstadoBadge({ estado }: { estado: CitaEstado }) {
  const { label, className } = config[estado] ?? config.pending
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
