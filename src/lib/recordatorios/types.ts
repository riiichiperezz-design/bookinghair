export interface DatosRecordatorio {
  telefono: string
  nombreCliente: string
  nombreNegocio: string
  fecha: string
  hora: string
}

export interface ResultadoEnvio {
  ok: boolean
  detalle?: string
}

export interface ProveedorRecordatorios {
  enviar(datos: DatosRecordatorio): Promise<ResultadoEnvio>
}
