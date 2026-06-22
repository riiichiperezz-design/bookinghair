import { useState } from 'react'
import { useSalon } from '../hooks/useSalon'
import { useServicios } from '../hooks/useServicios'
import { FormServicio } from '../components/FormServicio'
import { Spinner, SpinnerInline } from '../components/ui/Spinner'
import { ErrorAviso } from '../components/ui/ErrorAviso'
import type { Service } from '../types'

export function Servicios() {
  const { data: salon, isLoading: cargandoSalon } = useSalon()
  const { data: servicios = [], isLoading, error } = useServicios(salon?.id)
  const [servicioActivo, setServicioActivo] = useState<Service | null | undefined>(undefined)

  if (cargandoSalon) return <Spinner texto="Cargando servicios…" />

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Tu negocio</p>
          <h1 className="text-xl font-bold text-gray-900">Mis servicios</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-44">
        {isLoading && <SpinnerInline />}

        {error && (
          <ErrorAviso mensaje="No se pudieron cargar los servicios. Comprueba tu conexión." />
        )}

        {!isLoading && !error && servicios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-5xl">✂️</p>
            <p className="text-gray-700 font-semibold text-lg">Aún no tienes servicios</p>
            <p className="text-gray-400 text-sm">
              Añade el primero pulsando el botón de abajo.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {servicios.map(s => (
            <button
              key={s.id}
              onClick={() => setServicioActivo(s)}
              className={`w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 active:scale-[0.99] transition-transform ${
                !s.activo ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-gray-800">{s.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {s.duration_min} min
                    {s.price != null ? ` · ${s.price} €` : ''}
                  </p>
                </div>
                {!s.activo && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-200 text-gray-500 shrink-0">
                    Desactivado
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </main>

      <div className="fixed bottom-20 left-0 right-0 flex justify-center px-5 max-w-lg mx-auto z-10">
        <button
          onClick={() => setServicioActivo(null)}
          className="w-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-lg rounded-2xl py-4 shadow-lg shadow-violet-200 transition-all"
        >
          + Nuevo servicio
        </button>
      </div>

      {servicioActivo !== undefined && salon && (
        <FormServicio
          salonId={salon.id}
          servicio={servicioActivo}
          onClose={() => setServicioActivo(undefined)}
        />
      )}
    </div>
  )
}
