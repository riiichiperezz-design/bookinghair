import { useRecordatoriosPendientes, useMarcarRecordatorio } from '../hooks/useRecordatorios'
import { useSalon } from '../hooks/useSalon'
import { ProveedorSemiauto } from '../lib/recordatorios/proveedorSemiauto'
import { Spinner, SpinnerInline } from '../components/ui/Spinner'
import { ErrorAviso } from '../components/ui/ErrorAviso'
import type { Cita } from '../types'

const proveedor = new ProveedorSemiauto()

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function fechaBonita(iso: string): string {
  const d = new Date(iso)
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

function horaCorta(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function fechaManana(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return fechaBonita(d.toISOString())
}

export function Recordatorios() {
  const { data: salon, isLoading: cargandoSalon } = useSalon()
  const {
    data: citas = [],
    isLoading,
    error,
  } = useRecordatoriosPendientes(salon?.id)
  const marcar = useMarcarRecordatorio(salon?.id)

  if (cargandoSalon) return <Spinner texto="Cargando recordatorios…" />

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Avisos</p>
            <h1 className="text-xl font-bold text-gray-900">Recordatorios</h1>
            <p className="text-sm text-gray-500">Citas de mañana, {fechaManana()}</p>
          </div>
          {citas.length > 0 && (
            <span className="bg-violet-600 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center">
              {citas.length}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-44 space-y-3">
        {isLoading && <SpinnerInline />}

        {error && (
          <ErrorAviso mensaje="No se pudieron cargar los recordatorios. Comprueba tu conexión." />
        )}

        {!isLoading && !error && citas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-5xl">🎉</p>
            <p className="text-gray-700 font-semibold text-lg">¡Todo al día!</p>
            <p className="text-gray-400 text-sm">
              No hay recordatorios pendientes para mañana.
            </p>
          </div>
        )}

        {citas.map((c) => (
          <TarjetaRecordatorio
            key={c.id}
            cita={c}
            nombreNegocio={salon?.name ?? ''}
            onEnviado={() => marcar.mutate(c.id)}
          />
        ))}
      </main>
    </div>
  )
}

interface TarjetaProps {
  cita: Cita
  nombreNegocio: string
  onEnviado: () => void
}

function TarjetaRecordatorio({ cita, nombreNegocio, onEnviado }: TarjetaProps) {
  const nombre = cita.cliente?.name ?? 'Cliente'
  const telefono = cita.cliente?.phone ?? ''
  const hora = horaCorta(cita.starts_at)
  const fecha = fechaBonita(cita.starts_at)

  async function handleEnviar() {
    if (!telefono) {
      alert('Este cliente no tiene teléfono registrado.')
      return
    }

    const resultado = await proveedor.enviar({
      telefono,
      nombreCliente: nombre,
      nombreNegocio,
      fecha,
      hora,
    })

    if (resultado.ok && resultado.detalle) {
      window.open(resultado.detalle, '_blank')
      onEnviado()
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-2xl font-bold text-gray-800 leading-none">{hora}</p>
          <p className="text-base font-semibold text-gray-700 mt-1">{nombre}</p>
          <p className="text-sm text-gray-500">
            {cita.servicio?.name ?? 'Servicio'}
          </p>
          {!telefono && (
            <p className="text-xs text-orange-600 mt-1">Sin teléfono — no se puede enviar</p>
          )}
        </div>
        {telefono ? (
          <button
            onClick={handleEnviar}
            className="shrink-0 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold rounded-xl px-4 py-3 text-sm flex items-center gap-1.5 transition-all"
          >
            <span className="text-base">📱</span>
            Enviar
          </button>
        ) : (
          <button
            onClick={onEnviado}
            className="shrink-0 bg-gray-200 text-gray-500 font-medium rounded-xl px-4 py-3 text-sm"
          >
            Marcar hecho
          </button>
        )}
      </div>
    </div>
  )
}
