import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Cita, NuevaCita, CitaEstado } from '../types'

function inicioDia(fecha: Date) { const d = new Date(fecha); d.setHours(0,0,0,0); return d.toISOString() }
function finDia(fecha: Date) { const d = new Date(fecha); d.setHours(23,59,59,999); return d.toISOString() }

export function useCitas(salonId: string | undefined, fecha: Date) {
  return useQuery<Cita[]>({
    queryKey: ['citas', salonId, fecha.toDateString()],
    enabled: !!salonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, cliente:clients(name, phone), servicio:services(name, duration_min)')
        .eq('salon_id', salonId!)
        .gte('starts_at', inicioDia(fecha))
        .lte('starts_at', finDia(fecha))
        .order('starts_at')
      if (error) throw error
      return (data ?? []) as Cita[]
    },
  })
}

export function useCrearCita(salonId: string | undefined, fecha: Date) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cita: NuevaCita) => {
      const { data, error } = await supabase.from('appointments').insert(cita).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['citas', salonId, fecha.toDateString()] }) },
  })
}

export function useActualizarCita(salonId: string | undefined, fecha: Date) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cambios }: { id: string; cambios: Partial<{ client_id: string; service_id: string; starts_at: string; ends_at: string; status: CitaEstado; notes: string }> }) => {
      const { data, error } = await supabase.from('appointments').update(cambios).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['citas', salonId] }) },
  })
}

export function useBorrarCita(salonId: string | undefined, fecha: Date) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['citas', salonId, fecha.toDateString()] }) },
  })
}
