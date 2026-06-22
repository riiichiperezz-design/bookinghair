export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo'

export type Tramo = [string, string]

export interface DiaHorario {
  abierto: boolean
  tramos: Tramo[]
}

export type Horario = Record<DiaSemana, DiaHorario>

export interface Salon {
  id: string
  owner_id: string
  name: string
  phone: string | null
  address: string | null
  slug: string | null
  horario: Horario | null
  created_at: string
}

export interface Client {
  id: string
  salon_id: string
  name: string
  phone: string | null
  notes: string | null
  created_at: string
}

export interface Service {
  id: string
  salon_id: string
  name: string
  duration_min: number
  price: number | null
  activo: boolean
  created_at: string
}

export type CitaEstado = 'pending' | 'confirmed' | 'cancelled' | 'done' | 'no_show'

export type CitaOrigen = 'manual' | 'autorreserva'

export interface Cita {
  id: string
  salon_id: string
  client_id: string | null
  service_id: string | null
  starts_at: string
  ends_at: string
  status: CitaEstado
  origen: CitaOrigen
  recordatorio_enviado: boolean
  notes: string | null
  created_at: string
  cliente?: { name: string; phone: string | null } | null
  servicio?: { name: string; duration_min: number } | null
}

export interface NuevaCita {
  salon_id: string
  client_id: string
  service_id: string
  starts_at: string
  ends_at: string
  status: CitaEstado
  notes?: string
}
