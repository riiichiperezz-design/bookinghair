import { useState } from 'react'
import { useSalon } from '../hooks/useSalon'
import { ProveedorDemo } from '../lib/recordatorios/proveedorDemo'

const proveedor = new ProveedorDemo()

const EJEMPLO = {
  nombreCliente: 'María',
  telefono: '+34666000000',
  fecha: 'mañana martes',
  hora: '11:00',
}

export function Demo() {
  const { data: salon } = useSalon()
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [cargando, setCargando] = useState(false)

  const nombreNegocio = salon?.name ?? 'Mi Peluquería'

  async function simular() {
    setVisible(false)
    setMensaje(null)
    setCargando(true)

    const resultado = await proveedor.enviar({
      telefono: EJEMPLO.telefono,
      nombreCliente: EJEMPLO.nombreCliente,
      nombreNegocio,
      fecha: EJEMPLO.fecha,
      hora: EJEMPLO.hora,
    })

    setMensaje(resultado.detalle ?? '')
    setCargando(false)
    setTimeout(() => setVisible(true), 50)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">Demo de recordatorio</h1>
        <p className="text-sm text-gray-500">Así le llegaría el aviso a tu cliente</p>
      </header>

      <main className="flex-1 px-4 py-6 pb-44 space-y-6">
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-1">
          <p className="font-semibold text-violet-800">¿Cómo funciona?</p>
          <p className="text-sm text-violet-700 leading-relaxed">
            El día antes de cada cita, tu cliente recibe un WhatsApp automático
            recordándole la hora. No tienes que hacer nada: se envía solo.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <Telefono>
            <div className="bg-green-600 text-white px-3 py-2.5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                {EJEMPLO.nombreCliente[0]}
              </div>
              <div>
                <p className="font-semibold text-sm leading-none">
                  {EJEMPLO.nombreCliente}
                </p>
                <p className="text-xs text-green-200 mt-0.5">WhatsApp</p>
              </div>
            </div>

            <div className="flex-1 bg-[#eae6df] p-3 flex flex-col justify-end">
              {mensaje && (
                <BurbujaWA
                  texto={mensaje}
                  visible={visible}
                  hora={EJEMPLO.hora}
                />
              )}
              {!mensaje && !cargando && (
                <p className="text-center text-xs text-gray-400 py-4">
                  Pulsa el botón para ver cómo quedaría
                </p>
              )}
              {cargando && (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </Telefono>
        </div>

        <button
          onClick={simular}
          disabled={cargando}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 active:scale-95 text-white font-bold rounded-2xl py-4 text-lg transition-all"
        >
          {cargando ? 'Simulando…' : mensaje ? '🔄 Ver de nuevo' : '📱 Ver cómo llega el recordatorio'}
        </button>

        <p className="text-xs text-center text-gray-400 leading-relaxed">
          Esta es una simulación. El texto real usará el nombre de tu negocio
          y los datos reales de cada cita. Nada de esto se envía ahora.
        </p>
      </main>
    </div>
  )
}

function Telefono({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-64 rounded-[2.5rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden bg-white">
      <div className="bg-gray-800 flex justify-center py-2">
        <div className="w-16 h-1.5 rounded-full bg-gray-600" />
      </div>
      <div className="flex flex-col" style={{ height: '380px' }}>
        {children}
      </div>
      <div className="bg-gray-800 flex justify-center py-3">
        <div className="w-10 h-1 rounded-full bg-gray-600" />
      </div>
    </div>
  )
}

function BurbujaWA({
  texto,
  visible,
  hora,
}: {
  texto: string
  visible: boolean
  hora: string
}) {
  return (
    <div
      className={`transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm px-3 py-2 max-w-[90%] ml-1">
        <p className="text-xs text-gray-800 leading-relaxed">{texto}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-gray-400">{hora}</span>
          <span className="text-[10px] text-blue-500">✓✓</span>
        </div>
      </div>
    </div>
  )
}
