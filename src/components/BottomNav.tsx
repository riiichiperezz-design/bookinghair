import { NavLink } from 'react-router-dom'
import { useSalon } from '../hooks/useSalon'
import { useRecordatoriosPendientes } from '../hooks/useRecordatorios'

const ITEMS = [
  { to: '/agenda',        icono: '📅', etiqueta: 'Citas' },
  { to: '/recordatorios', icono: '💬', etiqueta: 'Avisos' },
  { to: '/servicios',     icono: '✂️', etiqueta: 'Servicios' },
  { to: '/ajustes',       icono: '⚙️', etiqueta: 'Ajustes' },
]

export function BottomNav() {
  const { data: salon } = useSalon()
  const { data: pendientes = [] } = useRecordatoriosPendientes(salon?.id)
  const numPendientes = pendientes.length

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 max-w-lg mx-auto">
      <div className="flex">
        {ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-colors ${
                isActive ? 'text-violet-700' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <span className="text-2xl leading-none">{item.icono}</span>
                  {item.to === '/recordatorios' && numPendientes > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {numPendientes > 9 ? '9+' : numPendientes}
                    </span>
                  )}
                </div>
                <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.etiqueta}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
