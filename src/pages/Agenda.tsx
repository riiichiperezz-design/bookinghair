import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSalon } from '../hooks/useSalon'
import { useCitas } from '../hooks/useCitas'
import { FormCita } from '../components/FormCita'
import { EstadoBadge } from '../components/ui/EstadoBadge'
import { Spinner, SpinnerInline } from '../components/ui/Spinner'
import { ErrorAviso } from '../components/ui/ErrorAviso'
import type { Cita, CitaEstado } from '../types'

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function mismaFecha(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

const bordeEstado: Record<CitaEstado, string> = {
  pending:   'border-l-gray-300',
  confirmed: 'border-l-green-400',
  done:      'border-l-green-600',
  cancelled: 'border-l-gray-300',
  no_show:   'border-l-red-400',
}

export function Agenda() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [fecha, setFecha] = useState(new Date())
  const [citaActiva, setCitaActiva] = useState<Cita | null | undefined>(undefined)

  const { data: salon, isLoading: cargandoSalon } = useSalon()
  const { data: citas = [], isLoading: cargandoCitas, error } = useCitas(salon?.id, fecha)

  function irDia(delta: number) {
    setFecha(d => {
      const nueva = new Date(d)
      nueva.setDate(nueva.getDate() + delta)
      return nueva
    })
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  if (cargandoSalon) return <Spinner texto="Cargando tu agenda…" />

  if (!salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-5xl">✂️</p>
        <h2 className="text-xl font-bold text-gray-800">Todavía no tienes un negocio creado</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Ve a Supabase → tabla <strong>salons</strong> e inserta una fila con tu identificador de usuario.
        </p>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 mt-4 py-2 px-4"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  const hoy = new Date()
  const esHoy = mismaFecha(fecha, hoy)
  const fechaTexto = `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <header className="bg-white border-b border-gray-100 px-5 pt-5 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Tu agenda</p>
            <h1 className="text-lg font-bold text-gray-900">{salon.name}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 py-1 px-2 rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => irDia(-1)}
            aria-label="Día anterior"
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gray-100 active:bg-gray-200 text-xl text-gray-600"
          >
            ‹
          </button>

          <div className="flex-1 text-center">
            <p className="text-base font-bold text-gray-800 capitalize">
              {esHoy ? 'Hoy' : fechaTexto}
            </p>
            {!esHoy && (
              <button
                onClick={() => setFecha(new Date())}
                className="text-xs text-violet-600 font-semibold mt-0.5"
              >
                Volver a hoy
              </button>
            )}
          </div>

          <button
            onClick={() => irDia(1)}
            aria-label="Día siguiente"
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gray-100 active:bg-gray-200 text-xl text-gray-600"
          >
            ›
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-44">
        {cargandoCitas && <SpinnerInline />}

        {error && (
          <ErrorAviso mensaje="No se han podido cargar las citas. Comprueba tu conexión." />
        )}

        {!cargandoCitas && !error && citas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-5xl">📅</p>
            <p className="text-gray-600 font-semibold text-lg">
              {esHoy ? 'Hoy no tienes citas' : 'No hay citas este día'}
            </p>
            <p className="text-gray-400 text-sm">
              Pulsa el botón de abajo para añadir una.
            </p>
          </div>
        )}

        {!cargandoCitas && citas.map(c => {
          const cancelada = c.status === 'cancelled'
          return (
            <button
              key={c.id}
              onClick={() => setCitaActiva(c)}
              className={`w-full text-left bg-white rounded-2xl border-l-4 shadow-sm border border-gray-100 px-4 py-4 mb-3 active:scale-[0.99] transition-transform ${bordeEstado[c.status]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={cancelada ? 'opacity-40 line-through' : ''}>
                  <p className="text-2xl font-bold text-gray-800 leading-none tabular-nums">
                    {formatHora(c.starts_at)}
                  </p>
                  <p className="text-base font-semibold text-gray-700 mt-1">
                    {c.cliente?.name ?? 'Sin nombre'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {c.servicio?.name ?? 'Servicio'}
                    {c.servicio?.duration_min ? ` · ${c.servicio.duration_min} min` : ''}
                  </p>
                  {c.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">{c.notes}</p>
                  )}
                  {c.origen === 'autorreserva' && (
                    <span className="inline-block mt-1.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-full px-2 py-0.5">
                      🌐 Reservada por el cliente
                    </span>
                  )}
                </div>
                <EstadoBadge estado={c.status} />
              </div>
            </button>
          )
        })}
      </main>

      <div className="fixed bottom-20 left-0 right-0 flex justify-center px-5 max-w-lg mx-auto z-10">
        <button
          onClick={() => setCitaActiva(null)}
          className="w-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-lg rounded-2xl py-4 shadow-lg shadow-violet-200 transition-all"
        >
          + Nueva cita
        </button>
      </div>

      {citaActiva !== undefined && (
        <FormCita
          salonId={salon.id}
          fecha={fecha}
          cita={citaActiva}
          onClose={() => setCitaActiva(undefined)}
        />
      )}
    </div>
  )
}
