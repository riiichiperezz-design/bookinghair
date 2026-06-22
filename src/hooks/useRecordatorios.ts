import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Cita } from '../types'

export function useRecordatoriosPendientes(salonId: string | undefined) {
  return useQuery<Cita[]>({
    queryKey: ['recordatorios', salonId],
    enabled: !!salonId,
    queryFn: async () => {
      const manana = new Date()
      manana.setDate(manana.getDate() + 1)
      const inicio = new Date(manana); inicio.setHours(0,0,0,0)
      const fin = new Date(manana); fin.setHours(23,59,59,999)
      const { data, error } = await supabase
        .from('appointments')
        .select('*, cliente:clients(name, phone), servicio:services(name, duration_min)')
        .eq('salon_id', salonId!)
        .eq('recordatorio_enviado', false)
        .neq('status', 'cancelled')
        .gte('starts_at', inicio.toISOString())
        .lte('starts_at', fin.toISOString())
        .order('starts_at')
      if (error) throw error
      return (data ?? []) as Cita[]
    },
  })
}

export function useMarcarRecordatorio(salonId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (citaId: string) => {
      const { error } = await supabase.from('appointments').update({ recordatorio_enviado: true }).eq('id', citaId)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recordatorios', salonId] }) },
  })
}
