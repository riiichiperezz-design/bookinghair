import type { ProveedorRecordatorios, DatosRecordatorio, ResultadoEnvio } from './types'
import { textoRecordatorio } from './plantilla'

export class ProveedorDemo implements ProveedorRecordatorios {
  async enviar(datos: DatosRecordatorio): Promise<ResultadoEnvio> {
    const texto = textoRecordatorio(datos)
    await new Promise((r) => setTimeout(r, 800))
    return { ok: true, detalle: texto }
  }
}
