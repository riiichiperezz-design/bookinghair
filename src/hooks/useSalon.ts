import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Salon, Horario } from '../types'

export function useSalon() {
  const { user } = useAuth()

  return useQuery<Salon | null>({
    queryKey: ['salon', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user!.id)
        .maybeSingle()

      if (error) throw error
      return data
    },
  })
}

export function generarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function useGuardarSalon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string
      cambios: Partial<{
        name: string
        phone: string | null
        address: string | null
        slug: string
        horario: Horario
      }>
    }) => {
      const { data, error } = await supabase
        .from('salons')
        .update(cambios)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Salon
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salon'] })
    },
  })
}
