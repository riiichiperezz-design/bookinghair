import { useState } from 'react'
import { useClientes, useCrearCliente } from '../hooks/useClientes'
import type { Client } from '../types'

interface Props {
  salonId: string
  seleccionado: Client | null
  onSeleccionar: (cliente: Client) => void
}

export function BuscadorCliente({ salonId, seleccionado, onSeleccionar }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [modoNuevo, setModoNuevo] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTelefono, setNuevoTelefono] = useState('')
  const [errNuevo, setErrNuevo] = useState('')

  const { data: clientes = [] } = useClientes(salonId, busqueda)
  const crearCliente = useCrearCliente(salonId)

  async function handleCrear() {
    if (!nuevoNombre.trim()) {
      setErrNuevo('El nombre es obligatorio')
      return
    }
    try {
      const nuevo = await crearCliente.mutateAsync({
        name: nuevoNombre.trim(),
        phone: nuevoTelefono.trim() || undefined,
      })
      onSeleccionar(nuevo)
      setModoNuevo(false)
      setBusqueda('')
    } catch {
      setErrNuevo('No se pudo crear el cliente')
    }
  }

  if (seleccionado) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div>
          <p className="font-semibold text-gray-800">{seleccionado.name}</p>
          {seleccionado.phone && (
            <p className="text-sm text-gray-500">{seleccionado.phone}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onSeleccionar(null!)}
          className="text-sm text-violet-600 font-medium"
        >
          Cambiar
        </button>
      </div>
    )
  }

  if (modoNuevo) {
    return (
      <div className="space-y-3 bg-violet-50 border border-violet-200 rounded-xl p-4">
        <p className="font-semibold text-violet-700">Cliente nuevo</p>
        <input
          autoFocus
          className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base"
          placeholder="Nombre *"
          value={nuevoNombre}
          onChange={e => setNuevoNombre(e.target.value)}
        />
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base"
          placeholder="Teléfono (opcional)"
          type="tel"
          value={nuevoTelefono}
          onChange={e => setNuevoTelefono(e.target.value)}
        />
        {errNuevo && <p className="text-red-500 text-sm">{errNuevo}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModoNuevo(false)}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCrear}
            disabled={crearCliente.isPending}
            className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-semibold disabled:opacity-60"
          >
            {crearCliente.isPending ? 'Guardando…' : 'Guardar cliente'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <input
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base"
        placeholder="Buscar cliente por nombre o teléfono…"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

      {busqueda.trim() && clientes.length === 0 && (
        <p className="text-sm text-gray-500 px-1">No encontrado.</p>
      )}

      {clientes.slice(0, 6).map(c => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSeleccionar(c)}
          className="w-full text-left bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 active:bg-gray-100"
        >
          <p className="font-medium text-gray-800">{c.name}</p>
          {c.phone && <p className="text-sm text-gray-500">{c.phone}</p>}
        </button>
      ))}

      <button
        type="button"
        onClick={() => setModoNuevo(true)}
        className="w-full py-3 rounded-xl border-2 border-dashed border-violet-300 text-violet-600 font-medium text-base"
      >
        + Crear cliente nuevo
      </button>
    </div>
  )
}
