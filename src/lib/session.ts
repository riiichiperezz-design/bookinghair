import type { User } from '@supabase/supabase-js';

import { supabase } from './supabase';

let pending: Promise<User> | null = null;

/**
 * Garantiza una sesión (anónima) y devuelve el usuario.
 * La sesión se persiste en AsyncStorage, así que solo se crea la primera vez.
 */
export async function ensureSession(): Promise<User> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return data.session.user;

  // Evita lanzar varios signInAnonymously en paralelo.
  if (!pending) {
    pending = supabase.auth
      .signInAnonymously()
      .then(({ data: anon, error }) => {
        if (error) throw error;
        if (!anon.user) throw new Error('No se pudo crear la sesión anónima.');
        return anon.user;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}
