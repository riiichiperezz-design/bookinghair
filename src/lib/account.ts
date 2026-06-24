import { ensureSession } from './session';
import { supabase } from './supabase';

/** Email vinculado a la cuenta, o null si sigue siendo solo anónima. */
export async function getAccountEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

/**
 * Vincula email + contraseña a la sesión anónima, para poder recuperar la
 * identidad (racha, voces, perfil) tras reinstalar.
 */
export async function linkAccount(email: string, password: string) {
  const { error } = await supabase.auth.updateUser({ email, password });
  if (error) throw error;
}

/**
 * Borra los datos del usuario (perfil, voces enviadas, reacciones) y cierra
 * sesión. La próxima vez se entra como un usuario anónimo nuevo.
 * Nota: borrar la cuenta de auth por completo requiere un proceso de servidor.
 */
export async function deleteMyData() {
  const user = await ensureSession();
  await supabase.from('reactions').delete().eq('user_id', user.id);
  await supabase.from('voices').delete().eq('sender_id', user.id);
  await supabase.from('profiles').delete().eq('id', user.id);
  await supabase.auth.signOut();
}
