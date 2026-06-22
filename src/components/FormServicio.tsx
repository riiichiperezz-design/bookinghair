import { useState } from 'react'
import { Modal } from './ui/Modal'
import { useCrearServicio, useEditarServicio, useToggleServicio } from '../hooks/useServicios'
import type { Service } from '../types'

const DURACIONES = [15, 30, 45, 60, 90, 120]

interface Props {
  salonId: string
  servicio?: Service | null
  onClose: () => void
}

export function FormServicio({ salonId, servicio, onClose }: Props) {
  const esEdicion = !!servicio

  const [nombre, setNombre] = useState(servicio?.name ?? '')
  const [duracion, setDuracion] = useState<number>(servicio?.duration_min ?? 30)
  const [precio, setPrecio] = useState<string>(
    servicio?.price != null ? String(servicio.price) : ''
  )
  const [error, setError] = useState('')

  const crear = useCrearServicio(salonId)
  const editar = useEditarServicio(salonId)
  const toggle = useToggleServicio(salonId)

  async function handleGuardar() {
    setError('')
    if (!nombre.trim()) { setError('Pon un nombre al servicio'); return }

    const precioNum = precio.trim() === '' ? null : Number(precio.replace(',', '.'))
    if (precioNum != null && Number.isNaN(precioNum)) {
      setError('El precio no es un número válido')
      return
    }

    const datos = {
      name: nombre.trim(),
      duration_min: duracion,
      price: precioNum,
    }

    try {
      if (esEdicion) {
        await editar.mutateAsync({ id: servicio!.id, datos })
      } else {
        await crear.mutateAsync(datos)
      }
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    }
  }

  async function handleToggle() {
    try {
      await toggle.mutateAsync({ id: servicio!.id, activo: !servicio!.activo })
      onClose()
    } catch {
      setError('No se pudo cambiar el servicio')
    }
  }

  const guardando = crear.isPending || editar.isPending

  return (
    <Modal titulo={esEdicion ? 'Editar servicio' : 'Nuevo servicio'} onClose={onClose}>
      <div className="space-y-5 pb-4">

        <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">
            ¿Cómo se llama?
          </label>
          <input
            autoFocus={!esEdicion}
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Corte de caballero"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base"
          />
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">
            ¿Cuánto dura?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DURACIONES.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDuracion(d)}
                className={`py-3 rounded-xl border-2 font-medium text-base transition-colors ${
                  duracion === d
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-700 mb-2">
            ¿Cuánto cuesta?
          </label>
          <div className="relative">
            <input
              inputMode="decimal"
              value={precio}
              onChange={e => setPrecio(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 text-base"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">€</span>
          </div>
        </div>

        {error && (
          <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm">{error}</p>
        )}

        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-2xl py-4 text-lg transition-colors"
        >
          {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Añadir servicio'}
        </button>

        {esEdicion && (
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggle.isPending}
            className={`w-full py-3 rounded-xl font-medium text-base ${
              servicio!.activo
                ? 'text-orange-600 bg-orange-50'
                : 'text-green-700 bg-green-50'
            }`}
          >
            {toggle.isPending
              ? 'Cambiando…'
              : servicio!.activo
                ? 'Desactivar (dejar de ofrecer)'
                : 'Volver a activar'}
          </button>
        )}
      </div>
    </Modal>
  )
}
