import { Platform } from 'react-native';

import { getItem, setItem } from './storage';

const ENABLED_KEY = 'ecco.notifications.enabled.v1';

// Carga perezosa: nunca importamos expo-notifications en web / render estático.
function mod(): typeof import('expo-notifications') | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications');
  } catch {
    return null;
  }
}

/**
 * Pide permiso y programa un recordatorio diario para no perder la racha.
 * Devuelve true si quedó activado.
 */
export async function enableDailyReminder(): Promise<boolean> {
  const N = mod();
  if (!N) return false;
  try {
    const current = await N.getPermissionsAsync();
    let granted = current.granted;
    if (!granted) {
      const req = await N.requestPermissionsAsync();
      granted = req.granted;
    }
    if (!granted) return false;

    await N.cancelAllScheduledNotificationsAsync();
    await N.scheduleNotificationAsync({
      content: {
        title: '🔥 Tu racha te espera',
        body: 'Alguien del mundo quiere oírte. Suelta una voz en ecco.',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 0,
      },
    });
    await setItem(ENABLED_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

/** Reprograma el recordatorio si ya estaba activado (llamar al arrancar). */
export async function ensureReminderScheduled(): Promise<void> {
  if (Platform.OS === 'web') return;
  const enabled = await getItem(ENABLED_KEY);
  if (enabled === '1') {
    await enableDailyReminder();
  }
}
