import type { DiaSemana, Horario } from '../types'

export const DIAS: { clave: DiaSemana; etiqueta: string }[] = [
  { clave: 'lunes', etiqueta: 'Lunes' },
  { clave: 'martes', etiqueta: 'Martes' },
  { clave: 'miercoles', etiqueta: 'Miércoles' },
  { clave: 'jueves', etiqueta: 'Jueves' },
  { clave: 'viernes', etiqueta: 'Viernes' },
  { clave: 'sabado', etiqueta: 'Sábado' },
  { clave: 'domingo', etiqueta: 'Domingo' },
]

export function horarioPorDefecto(): Horario {
  return {
    lunes:    { abierto: true,  tramos: [['10:00','14:00'],['17:00','20:00']] },
    martes:   { abierto: true,  tramos: [['10:00','14:00'],['17:00','20:00']] },
    miercoles:{ abierto: true,  tramos: [['10:00','14:00'],['17:00','20:00']] },
    jueves:   { abierto: true,  tramos: [['10:00','14:00'],['17:00','20:00']] },
    viernes:  { abierto: true,  tramos: [['10:00','14:00'],['17:00','20:00']] },
    sabado:   { abierto: true,  tramos: [['10:00','14:00']] },
    domingo:  { abierto: false, tramos: [] },
  }
}

export const HORAS: string[] = (() => {
  const lista: string[] = []
  for (let h = 6; h <= 23; h++) {
    for (const m of ['00', '30']) {
      lista.push(`${String(h).padStart(2, '0')}:${m}`)
    }
  }
  return lista
})()
