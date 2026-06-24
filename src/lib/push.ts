import { Platform } from 'react-native';

import { ensureSession } from './session';
import { supabase } from './supabase';

function notifMod(): typeof import('expo-notifications') | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications');
  } catch {
    return null;
  }
}

function projectId(): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default;
    return (
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId
    );
  } catch {
    return undefined;
  }
}

/**
 * Registra el Expo push token del dispositivo en el perfil.
 * Solo nativo; necesita permiso y un projectId (tras `eas init`). No-op si falta.
 */
export async function registerPushToken(): Promise<void> {
  const N = notifMod();
  if (!N) return;
  try {
    const perm = await N.getPermissionsAsync();
    let granted = perm.granted;
    if (!granted) granted = (await N.requestPermissionsAsync()).granted;
    if (!granted) return;

    const id = projectId();
    if (!id) return; // sin EAS projectId no se puede obtener el token

    const { data: token } = await N.getExpoPushTokenAsync({ projectId: id });
    if (!token) return;

    const user = await ensureSession();
    await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
  } catch {
    // sin permiso / sin build nativo: ignorar
  }
}
