import { getJSON, setJSON } from './storage';

const KEY = 'ecco.streak.v1';

type StreakData = {
  count: number;
  /** Último día activo en formato YYYY-MM-DD (hora local). */
  lastActiveDay: string;
  /** Racha más alta alcanzada. */
  best: number;
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function today(): string {
  return dayKey(new Date());
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

export type Streak = { count: number; best: number; isNewDay: boolean };

/**
 * Marca actividad de hoy y devuelve la racha.
 *   · mismo día → sin cambios
 *   · ayer → +1
 *   · hueco → vuelve a 1
 */
export async function touchStreak(): Promise<Streak> {
  const t = today();
  const data = await getJSON<StreakData>(KEY);

  if (!data) {
    const fresh: StreakData = { count: 1, lastActiveDay: t, best: 1 };
    await setJSON(KEY, fresh);
    return { count: 1, best: 1, isNewDay: true };
  }

  if (data.lastActiveDay === t) {
    return { count: data.count, best: data.best, isNewDay: false };
  }

  const count = data.lastActiveDay === yesterday() ? data.count + 1 : 1;
  const best = Math.max(count, data.best ?? 0);
  await setJSON(KEY, { count, lastActiveDay: t, best });
  return { count, best, isNewDay: true };
}

/** Racha más alta alcanzada. */
export async function getStreakBest(): Promise<number> {
  const data = await getJSON<StreakData>(KEY);
  return data?.best ?? 0;
}

/** Racha actual sin modificar nada (0 si está rota). */
export async function getStreakCount(): Promise<number> {
  const data = await getJSON<StreakData>(KEY);
  if (!data) return 0;
  if (data.lastActiveDay === today() || data.lastActiveDay === yesterday()) {
    return data.count;
  }
  return 0;
}
