import type { DatosRecordatorio } from './types'

export function textoRecordatorio(datos: DatosRecordatorio): string {
  return (
    `Hola ${datos.nombreCliente}, te recordamos tu cita en ${datos.nombreNegocio} ` +
    `el ${datos.fecha} a las ${datos.hora}. ` +
    `Si no puedes venir, avísanos por favor. ¡Gracias!`
  )
}

export function normalizarTelefono(tel: string): string {
  const limpio = tel.replace(/[\s\-().]/g, '')
  if (limpio.startsWith('+')) return limpio
  if (limpio.startsWith('00')) return '+' + limpio.slice(2)
  if (/^[6789]\d{8}$/.test(limpio)) return '+34' + limpio
  return limpio
}
