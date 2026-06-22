import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'

export function useClientes(salonId: string | undefined, busqueda = '') {
  return useQuery<Client[]>({
    queryKey: ['clientes', salonId, busqueda],
    enabled: !!salonId,
    queryFn: async () => {
      let q = supabase.from('clients').select('*').eq('salon_id', salonId!).order('name')
      if (busqueda.trim()) {
        q = q.or(`name.ilike.%${busqueda.trim()}%,phone.ilike.%${busqueda.trim()}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCrearCliente(salonId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (datos: { name: string; phone?: string; notes?: string }) => {
      const { data, error } = await supabase.from('clients').insert({ salon_id: salonId!, ...datos }).select().single()
      if (error) throw error
      return data as Client
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clientes', salonId] }) },
  })
}
