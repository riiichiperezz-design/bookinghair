import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSalon, useGuardarSalon, generarSlug } from '../hooks/useSalon'
import { DIAS, HORAS, horarioPorDefecto } from '../lib/horario'
import { Spinner } from '../components/ui/Spinner'
import { AvisoGuardado } from '../components/ui/AvisoGuardado'
import type { Horario, DiaSemana } from '../types'

export function Ajustes() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { data: salon, isLoading } = useSalon()
  const guardar = useGuardarSalon()

  if (isLoading) return <Spinner texto="Cargando ajustes…" />

  if (!salon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-3">
        <p className="text-5xl">⚙️</p>
        <p className="text-gray-600 font-semibold">No se ha encontrado tu negocio.</p>
      </div>
    )
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Tu negocio</p>
        <h1 className="text-xl font-bold text-gray-900">Ajustes</h1>
      </header>

      <main className="flex-1 px-4 py-4 pb-44 space-y-4">
        <BloqueMisDatos salon={salon} guardar={guardar} />
        <BloqueHorario salon={salon} guardar={guardar} />
        <BloqueEnlace slug={salon.slug} />

        <button
          onClick={() => navigate('/demo')}
          className="w-full bg-violet-50 border border-violet-200 rounded-2xl py-4 flex items-center gap-3 px-4"
        >
          <span className="text-2xl">📱</span>
          <div className="text-left">
            <p className="font-semibold text-violet-800">Demo de recordatorio</p>
            <p className="text-xs text-violet-600">Ver cómo le llega el aviso a tu cliente</p>
          </div>
          <span className="ml-auto text-violet-400 text-lg">›</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full py-3 text-gray-400 font-medium text-sm"
        >
          Cerrar sesión
        </button>
      </main>
    </div>
  )
}

type GuardarSalon = ReturnType<typeof useGuardarSalon>

function BloqueMisDatos({
  salon,
  guardar,
}: {
  salon: NonNullable<ReturnType<typeof useSalon>['data']>
  guardar: GuardarSalon
}) {
  const [nombre, setNombre] = useState(salon.name)
  const [telefono, setTelefono] = useState(salon.phone ?? '')
  const [direccion, setDireccion] = useState(salon.address ?? '')
  const [ok, setOk] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function onGuardar() {
    setOk(false)
    setErrorMsg('')
    if (!nombre.trim()) { setErrorMsg('El nombre no puede estar vacío'); return }
    try {
      await guardar.mutateAsync({
        id: salon.id,
        cambios: {
          name: nombre.trim(),
          phone: telefono.trim() || null,
          address: direccion.trim() || null,
          ...(salon.slug ? {} : { slug: generarSlug(nombre) }),
        },
      })
      setOk(true)
      setTimeout(() => setOk(false), 3000)
    } catch {
      setErrorMsg('No se pudieron guardar los datos. Comprueba tu conexión.')
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-3">Mis datos</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Nombre del negocio</label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Teléfono</label>
          <input
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Dirección</label>
          <input
            value={direccion}
            onChange={e => setDireccion(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <AvisoGuardado ok={ok} error={errorMsg} />
        <button
          onClick={onGuardar}
          disabled={guardar.isPending}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-xl py-3.5 text-base transition-colors"
        >
          {guardar.isPending ? 'Guardando…' : 'Guardar mis datos'}
        </button>
      </div>
    </section>
  )
}

function BloqueHorario({
  salon,
  guardar,
}: {
  salon: NonNullable<ReturnType<typeof useSalon>['data']>
  guardar: GuardarSalon
}) {
  const [horario, setHorario] = useState<Horario>(
    salon.horario ?? horarioPorDefecto()
  )
  const [ok, setOk] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  function actualizarDia(dia: DiaSemana, cambio: Partial<Horario[DiaSemana]>) {
    setHorario(h => ({ ...h, [dia]: { ...h[dia], ...cambio } }))
  }

  function toggleAbierto(dia: DiaSemana) {
    const actual = horario[dia]
    if (actual.abierto) {
      actualizarDia(dia, { abierto: false })
    } else {
      actualizarDia(dia, {
        abierto: true,
        tramos: actual.tramos.length ? actual.tramos : [['10:00', '20:00']],
      })
    }
  }

  function cambiarHora(dia: DiaSemana, iTramo: number, iHora: 0 | 1, valor: string) {
    setHorario(h => {
      const tramos = h[dia].tramos.map(t => [...t] as [string, string])
      tramos[iTramo][iHora] = valor
      return { ...h, [dia]: { ...h[dia], tramos } }
    })
  }

  function añadirDescanso(dia: DiaSemana) {
    setHorario(h => {
      const [inicio, fin] = h[dia].tramos[0] ?? ['10:00', '20:00']
      return {
        ...h,
        [dia]: { ...h[dia], tramos: [[inicio, '14:00'], ['17:00', fin]] },
      }
    })
  }

  function quitarDescanso(dia: DiaSemana) {
    setHorario(h => {
      const primero = h[dia].tramos[0] ?? ['10:00', '20:00']
      const ultimo = h[dia].tramos[h[dia].tramos.length - 1] ?? primero
      return {
        ...h,
        [dia]: { ...h[dia], tramos: [[primero[0], ultimo[1]]] },
      }
    })
  }

  async function onGuardar() {
    setOk(false)
    setErrorMsg('')
    try {
      await guardar.mutateAsync({ id: salon.id, cambios: { horario } })
      setOk(true)
      setTimeout(() => setOk(false), 3000)
    } catch {
      setErrorMsg('No se pudo guardar el horario. Comprueba tu conexión.')
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Mi horario</h2>
      <p className="text-sm text-gray-500 mb-3">Cuándo abres cada día</p>

      <div className="space-y-3">
        {DIAS.map(({ clave, etiqueta }) => {
          const dia = horario[clave]
          const tieneDescanso = dia.tramos.length >= 2
          return (
            <div key={clave} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{etiqueta}</span>
                <button
                  type="button"
                  onClick={() => toggleAbierto(clave)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    dia.abierto
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {dia.abierto ? 'Abierto' : 'Cerrado'}
                </button>
              </div>

              {dia.abierto && (
                <div className="space-y-2">
                  {dia.tramos.map((tramo, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <SelectHora
                        valor={tramo[0]}
                        onChange={v => cambiarHora(clave, i, 0, v)}
                      />
                      <span className="text-gray-400">a</span>
                      <SelectHora
                        valor={tramo[1]}
                        onChange={v => cambiarHora(clave, i, 1, v)}
                      />
                    </div>
                  ))}

                  {tieneDescanso ? (
                    <button
                      type="button"
                      onClick={() => quitarDescanso(clave)}
                      className="text-sm text-gray-500 font-medium"
                    >
                      Quitar descanso a mediodía
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => añadirDescanso(clave)}
                      className="text-sm text-violet-600 font-medium"
                    >
                      + Añadir descanso a mediodía
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3">
        <AvisoGuardado ok={ok} error={errorMsg} />
      </div>

      <button
        onClick={onGuardar}
        disabled={guardar.isPending}
        className="w-full mt-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-xl py-3.5 text-base transition-colors"
      >
        {guardar.isPending ? 'Guardando…' : 'Guardar horario'}
      </button>
    </section>
  )
}

function SelectHora({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <select
      value={valor}
      onChange={e => onChange(e.target.value)}
      className="flex-1 border border-gray-300 rounded-xl px-3 py-3 text-base bg-white"
    >
      {!HORAS.includes(valor) && <option value={valor}>{valor}</option>}
      {HORAS.map(h => (
        <option key={h} value={h}>{h}</option>
      ))}
    </select>
  )
}

function BloqueEnlace({ slug }: { slug: string | null }) {
  const [copiado, setCopiado] = useState(false)
  const enlace = `${window.location.origin}/reservar/${slug ?? ''}`

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace)
    } catch {
      // fallback: el usuario puede copiar manualmente
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Mi enlace para reservas</h2>
      <p className="text-sm text-gray-500 mb-3">
        Compártelo en tu WhatsApp o Instagram para que te reserven.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 break-all text-sm text-gray-700">
        {enlace}
      </div>

      <button
        onClick={copiar}
        className={`w-full font-semibold rounded-xl py-3 text-base transition-colors ${
          copiado
            ? 'bg-green-100 text-green-700'
            : 'bg-violet-600 hover:bg-violet-700 text-white'
        }`}
      >
        {copiado ? '✓ ¡Enlace copiado!' : 'Copiar enlace'}
      </button>

      <p className="text-xs text-gray-400 mt-2 text-center">
        (El enlace empezará a funcionar en la próxima actualización.)
      </p>
    </section>
  )
}
