import type { ProveedorRecordatorios, DatosRecordatorio, ResultadoEnvio } from './types'
import { textoRecordatorio, normalizarTelefono } from './plantilla'

export class ProveedorSemiauto implements ProveedorRecordatorios {
  async enviar(datos: DatosRecordatorio): Promise<ResultadoEnvio> {
    const tel = normalizarTelefono(datos.telefono).replace('+', '')
    const texto = textoRecordatorio(datos)
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`
    return { ok: true, detalle: url }
  }
}
