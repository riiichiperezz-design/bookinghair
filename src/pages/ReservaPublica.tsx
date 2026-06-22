import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { llamarFuncion } from '../lib/funciones'
import type { Horario } from '../types'

interface ServicioPublico {
  id: string
  nombre: string
  duracion_min: number
  precio: number | null
}
interface ReservaInfo {
  negocio: { nombre: string }
  horario: Horario | null
  servicios: ServicioPublico[]
}

const CLAVES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const
const DIAS_CORTO = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function fechaISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function proximosDias(n: number): Date[] {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(hoy)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function ReservaPublica() {
  const { slug } = useParams<{ slug: string }>()

  const [info, setInfo] = useState<ReservaInfo | null>(null)
  const [cargandoInfo, setCargandoInfo] = useState(true)
  const [errorInfo, setErrorInfo] = useState('')

  const [paso, setPaso] = useState(1)
  const [servicio, setServicio] = useState<ServicioPublico | null>(null)
  const [fecha, setFecha] = useState<string>('')
  const [hora, setHora] = useState<string>('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')

  const [huecos, setHuecos] = useState<string[]>([])
  const [cargandoHuecos, setCargandoHuecos] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorPaso, setErrorPaso] = useState('')

  useEffect(() => {
    if (!slug) return
    llamarFuncion<ReservaInfo>('reserva-info', { slug })
      .then(setInfo)
      .catch((e) => setErrorInfo(e.message))
      .finally(() => setCargandoInfo(false))
  }, [slug])

  async function elegirDia(d: string) {
    setFecha(d)
    setHora('')
    setErrorPaso('')
    setCargandoHuecos(true)
    try {
      const r = await llamarFuncion<{ huecos: string[] }>('reserva-huecos', {
        slug,
        servicioId: servicio!.id,
        fecha: d,
      })
      setHuecos(r.huecos)
    } catch (e) {
      setErrorPaso(e instanceof Error ? e.message : 'No se pudieron cargar los huecos')
      setHuecos([])
    } finally {
      setCargandoHuecos(false)
    }
  }

  async function confirmar() {
    setErrorPaso('')
    setEnviando(true)
    try {
      await llamarFuncion('crear-reserva', {
        slug,
        servicioId: servicio!.id,
        fecha,
        hora,
        nombre,
        telefono,
      })
      setPaso(5)
    } catch (e) {
      setErrorPaso(e instanceof Error ? e.message : 'No se pudo crear la cita')
    } finally {
      setEnviando(false)
    }
  }

  if (cargandoInfo) {
    return (
      <Pantalla>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Pantalla>
    )
  }

  if (errorInfo || !info) {
    return (
      <Pantalla>
        <div className="text-center py-20 px-6">
          <p className="text-5xl mb-3">😕</p>
          <p className="text-gray-600 text-lg">{errorInfo || 'No encontramos esta peluquería.'}</p>
        </div>
      </Pantalla>
    )
  }

  const dias = proximosDias(14)

  return (
    <Pantalla>
      <header className="text-center pt-8 pb-4 px-5">
        <p className="text-sm text-violet-600 font-medium">Reserva tu cita en</p>
        <h1 className="text-2xl font-bold text-gray-800">{info.negocio.nombre}</h1>
      </header>

      <div className="px-5 pb-12">
        {paso === 1 && (
          <Paso titulo="¿Qué te quieres hacer?">
            {info.servicios.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                Esta peluquería todavía no tiene servicios disponibles.
              </p>
            )}
            <div className="space-y-3">
              {info.servicios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setServicio(s); setPaso(2) }}
                  className="w-full text-left bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 active:scale-[0.99] transition-transform"
                >
                  <p className="text-lg font-bold text-gray-800">{s.nombre}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {s.duracion_min} min{s.precio != null ? ` · ${s.precio} €` : ''}
                  </p>
                </button>
              ))}
            </div>
          </Paso>
        )}

        {paso === 2 && servicio && (
          <Paso titulo="¿Qué día te viene bien?" onAtras={() => setPaso(1)}>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {dias.map((d) => {
                const iso = fechaISO(d)
                const clave = CLAVES[d.getDay()]
                const abierto = info.horario?.[clave]?.abierto ?? false
                const sel = fecha === iso
                return (
                  <button
                    key={iso}
                    disabled={!abierto}
                    onClick={() => elegirDia(iso)}
                    className={`shrink-0 w-16 py-2 rounded-2xl border-2 flex flex-col items-center ${
                      sel ? 'border-violet-500 bg-violet-50'
                        : abierto ? 'border-gray-200 bg-white'
                        : 'border-gray-100 bg-gray-50 opacity-40'
                    }`}
                  >
                    <span className="text-xs text-gray-500">{DIAS_CORTO[d.getDay()]}</span>
                    <span className="text-lg font-bold text-gray-800">{d.getDate()}</span>
                    <span className="text-xs text-gray-400">{MESES_CORTO[d.getMonth()]}</span>
                  </button>
                )
              })}
            </div>

            {fecha && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-gray-600 mb-2">Elige la hora:</p>
                {cargandoHuecos ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : huecos.length === 0 ? (
                  <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-2xl">
                    No quedan huecos libres este día. Prueba otro.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {huecos.map((h) => (
                      <button
                        key={h}
                        onClick={() => { setHora(h); setPaso(3) }}
                        className="py-3 rounded-xl border-2 border-gray-200 bg-white font-semibold text-gray-800 active:bg-violet-50 active:border-violet-400"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errorPaso && <Aviso>{errorPaso}</Aviso>}
          </Paso>
        )}

        {paso === 3 && (
          <Paso titulo="¿Cómo te llamas?" onAtras={() => setPaso(2)}>
            <div className="space-y-3">
              <input
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-base"
              />
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Tu teléfono"
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-base"
              />
              <button
                disabled={nombre.trim().length < 2 || telefono.trim().length < 9}
                onClick={() => setPaso(4)}
                className="w-full bg-violet-600 disabled:opacity-50 text-white font-bold rounded-2xl py-4 text-lg"
              >
                Continuar
              </button>
            </div>
          </Paso>
        )}

        {paso === 4 && servicio && (
          <Paso titulo="¿Confirmamos tu cita?" onAtras={() => setPaso(3)}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
              <Fila etiqueta="Servicio" valor={servicio.nombre} />
              <Fila etiqueta="Día" valor={fechaBonita(fecha)} />
              <Fila etiqueta="Hora" valor={hora} />
              <Fila etiqueta="A nombre de" valor={nombre} />
              <Fila etiqueta="Teléfono" valor={telefono} />
            </div>

            {errorPaso && <Aviso>{errorPaso}</Aviso>}

            <button
              disabled={enviando}
              onClick={confirmar}
              className="w-full mt-5 bg-violet-600 disabled:opacity-60 text-white font-bold rounded-2xl py-4 text-lg"
            >
              {enviando ? 'Reservando…' : 'Sí, reservar mi cita'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
              Al reservar aceptas que usemos tus datos para gestionar tu cita.{' '}
              <a href="/privacidad" className="underline text-gray-500">Más información</a>
            </p>
          </Paso>
        )}

        {paso === 5 && servicio && (
          <div className="text-center pt-10">
            <p className="text-6xl mb-4">✅</p>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Listo!</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Tu cita es el <strong>{fechaBonita(fecha)}</strong>
              <br />a las <strong>{hora}</strong>.
            </p>
            <p className="text-gray-500 mt-4">Te enviaremos un recordatorio. ¡Te esperamos!</p>
          </div>
        )}
      </div>
    </Pantalla>
  )
}

function Pantalla({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto min-h-screen bg-gray-50">{children}</div>
    </div>
  )
}

function Paso({
  titulo,
  onAtras,
  children,
}: {
  titulo: string
  onAtras?: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      {onAtras && (
        <button onClick={onAtras} className="text-violet-600 font-medium mb-3 text-sm">
          ‹ Atrás
        </button>
      )}
      <h2 className="text-xl font-bold text-gray-800 mb-4">{titulo}</h2>
      {children}
    </div>
  )
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{etiqueta}</span>
      <span className="font-semibold text-gray-800 text-right">{valor}</span>
    </div>
  )
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm text-center">
      {children}
    </p>
  )
}

function fechaBonita(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const fecha = new Date(y, m - 1, d)
  return `${DIAS_CORTO[fecha.getDay()]} ${d} de ${MESES_CORTO[m - 1]}`
}
