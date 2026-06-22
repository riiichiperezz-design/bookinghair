import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Service } from '../types'

export function useServicios(salonId: string | undefined, soloActivos = false) {
  return useQuery<Service[]>({
    queryKey: ['servicios', salonId, soloActivos],
    enabled: !!salonId,
    queryFn: async () => {
      let q = supabase.from('services').select('*').eq('salon_id', salonId!)
      if (soloActivos) q = q.eq('activo', true)
      const { data, error } = await q.order('activo', { ascending: false }).order('name')
      if (error) throw error
      return data ?? []
    },
  })
}

interface DatosServicio { name: string; duration_min: number; price: number | null }

export function useCrearServicio(salonId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (datos: DatosServicio) => {
      const { data, error } = await supabase.from('services').insert({ salon_id: salonId!, activo: true, ...datos }).select().single()
      if (error) throw error
      return data as Service
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['servicios', salonId] }) },
  })
}

export function useEditarServicio(salonId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: DatosServicio }) => {
      const { data, error } = await supabase.from('services').update(datos).eq('id', id).select().single()
      if (error) throw error
      return data as Service
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['servicios', salonId] }) },
  })
}

export function useToggleServicio(salonId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.from('services').update({ activo }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['servicios', salonId] }) },
  })
}
