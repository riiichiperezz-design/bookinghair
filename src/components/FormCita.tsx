import { useState } from 'react'
import { Modal } from './ui/Modal'
import { BuscadorCliente } from './BuscadorCliente'
import { useServicios } from '../hooks/useServicios'
import { useCrearCita, useActualizarCita, useBorrarCita } from '../hooks/useCitas'
import type { Cita, CitaEstado, Client } from '../types'

const ESTADOS: { valor: CitaEstado; label: string; color: string }[] = [
  { valor: 'confirmed', label: 'Confirmada',     color: 'bg-green-100 text-green-700 border-green-300' },
  { valor: 'done',      label: 'Hecha',          color: 'bg-green-200 text-green-800 border-green-400' },
  { valor: 'no_show',   label: 'No vino',        color: 'bg-red-100 text-red-600 border-red-300' },
  { valor: 'cancelled', label: 'Cancelada',      color: 'bg-gray-100 text-gray-600 border-gray-300' },
]

interface Props {
  salonId: string
  fecha: Date
  cita?: Cita | null
  onClose: () => void
}

function fechaHoraLocal(fecha: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}` +
    `T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`
  )
}

function inicioDefecto(fecha: Date): string {
  const d = new Date(fecha)
  d.setHours(9, 0, 0, 0)
  return fechaHoraLocal(d)
}

export function FormCita({ salonId, fecha, cita, onClose }: Props) {
  const esEdicion = !!cita

  const { data: servicios = [] } = useServicios(salonId, true)

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Client | null>(
    cita?.cliente ? ({ id: cita.client_id!, name: cita.cliente.name, phone: cita.cliente.phone, salon_id: salonId, notes: null, created_at: '' }) : null
  )
  const [servicioId, setServicioId] = useState(cita?.service_id ?? '')
  const [inicio, setInicio] = useState(
    cita ? fechaHoraLocal(new Date(cita.starts_at)) : inicioDefecto(fecha)
  )
  const [notas, setNotas] = useState(cita?.notes ?? '')
  const [estado, setEstado] = useState<CitaEstado>(cita?.status ?? 'confirmed')
  const [error, setError] = useState('')
  const [confirmaBorrar, setConfirmaBorrar] = useState(false)

  const crearCita = useCrearCita(salonId, fecha)
  const actualizarCita = useActualizarCita(salonId, fecha)
  const borrarCita = useBorrarCita(salonId, fecha)

  const servicioActual = servicios.find(s => s.id === servicioId)

  async function handleGuardar() {
    setError('')
    if (!clienteSeleccionado) { setError('Elige o crea un cliente'); return }
    if (!servicioId) { setError('Elige un servicio'); return }
    if (!inicio) { setError('Pon la fecha y hora'); return }

    const startsAt = new Date(inicio).toISOString()
    const duracion = servicioActual?.duration_min ?? 30
    const endsAt = new Date(new Date(inicio).getTime() + duracion * 60_000).toISOString()

    try {
      if (esEdicion) {
        await actualizarCita.mutateAsync({
          id: cita!.id,
          cambios: {
            client_id: clienteSeleccionado.id,
            service_id: servicioId,
            starts_at: startsAt,
            ends_at: endsAt,
            status: estado,
            notes: notas || undefined,
          },
        })
      } else {
        await crearCita.mutateAsync({
          salon_id: salonId,
          client_id: clienteSeleccionado.id,
          service_id: servicioId,
          starts_at: startsAt,
          ends_at: endsAt,
          status: 'confirmed',
          notes: notas || undefined,
        })
      }
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la cita')
    }
  }

  async function handleBorrar() {
    try {
      await borrarCita.mutateAsync(cita!.id)
      onClose()
    } catch {
      setError('No se pudo quitar la cita')
    }
  }

  const guardando = crearCita.isPending || actualizarCita.isPending

  return (
    <Modal titulo={esEdicion ? 'Editar cita' : 'Nueva cita'} onClose={onClose}>
      <div className="space-y-5 pb-4">

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Cliente
          </label>
          <BuscadorCliente
            salonId={salonId}
            seleccionado={clienteSeleccionado}
            onSeleccionar={setClienteSeleccionado}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Servicio
          </label>
          {servicios.length === 0 ? (
            <p className="text-sm text-orange-600 bg-orange-50 rounded-xl px-4 py-3">
              No tienes servicios creados todavía. Créalos desde Supabase o espera al próximo sprint.
            </p>
          ) : (
            <div className="space-y-2">
              {servicios.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServicioId(s.id)}
                  className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-colors ${
                    servicioId === s.id
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {s.duration_min} min
                    {s.price ? ` · ${s.price} €` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Día y hora
          </label>
          <input
            type="datetime-local"
            value={inicio}
            onChange={e => setInicio(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base"
          />
          {servicioActual && (
            <p className="text-sm text-gray-500 mt-1 px-1">
              Termina a las{' '}
              {inicio
                ? new Date(
                    new Date(inicio).getTime() + servicioActual.duration_min * 60_000
                  ).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                : '—'}
              {' '}({servicioActual.duration_min} min)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Notas (opcional)
          </label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={2}
            placeholder="Ej: alergia al tinte, viene con su madre…"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base resize-none"
          />
        </div>

        {esEdicion && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estado
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ESTADOS.map(e => (
                <button
                  key={e.valor}
                  type="button"
                  onClick={() => setEstado(e.valor)}
                  className={`py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    estado === e.valor ? e.color + ' border-2' : 'bg-white border-gray-200 text-gray-500'
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-2xl py-4 text-lg transition-colors"
        >
          {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Añadir cita'}
        </button>

        {esEdicion && (
          <div>
            {confirmaBorrar ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                <p className="text-red-700 font-medium text-center">
                  ¿Seguro que quieres quitar esta cita?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmaBorrar(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
                  >
                    No, cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleBorrar}
                    disabled={borrarCita.isPending}
                    className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-60"
                  >
                    {borrarCita.isPending ? 'Quitando…' : 'Sí, quitar'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmaBorrar(true)}
                className="w-full py-3 text-red-500 font-medium text-sm"
              >
                Quitar esta cita
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
