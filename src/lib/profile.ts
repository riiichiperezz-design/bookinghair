import { ensureSession } from './session';
import { supabase } from './supabase';

export type Profile = {
  id: string;
  username: string | null;
  country: string | null;
  rol: string;
};

/** Perfil del usuario actual, o null si aún no lo ha creado. */
export async function getMyProfile(): Promise<Profile | null> {
  const user = await ensureSession();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, country, rol')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export class UsernameTakenError extends Error {
  constructor() {
    super('Ese nombre ya está cogido. Prueba con otro.');
    this.name = 'UsernameTakenError';
  }
}

/** Crea o actualiza el perfil del usuario actual. */
export async function saveProfile(username: string, country: string | null) {
  const user = await ensureSession();
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, username, country });
  if (error) {
    // 23505 = violación de unicidad (username repetido)
    if ((error as { code?: string }).code === '23505') {
      throw new UsernameTakenError();
    }
    throw error;
  }
}
