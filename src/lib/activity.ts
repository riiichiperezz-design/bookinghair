import { ensureSession } from './session';
import { getItem, setItem } from './storage';
import { getStreakBest } from './streak';
import { supabase } from './supabase';

const LAST_SEEN_KEY = 'ecco.activity.lastSeen.v1';

export type ReactionEvent = {
  id: string;
  emoji: string;
  created_at: string;
  voiceId: string;
};

export type Stats = {
  sent: number;
  received: number;
  reactions: number;
  countries: number;
  streakBest: number;
};

async function myVoiceIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('voices')
    .select('id')
    .eq('sender_id', userId);
  return (data ?? []).map((r) => r.id as string);
}

/** Reacciones que OTROS han dejado en las voces que tú enviaste. */
export async function fetchReceivedReactions(): Promise<ReactionEvent[]> {
  const user = await ensureSession();
  const ids = await myVoiceIds(user.id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from('reactions')
    .select('id, emoji, created_at, voice_id')
    .in('voice_id', ids)
    .order('created_at', { ascending: false })
    .limit(100);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    emoji: r.emoji as string,
    created_at: r.created_at as string,
    voiceId: r.voice_id as string,
  }));
}

/** Nº de reacciones nuevas (desde la última vez que viste Novedades). */
export async function getNewActivityCount(): Promise<number> {
  const user = await ensureSession();
  const ids = await myVoiceIds(user.id);
  if (ids.length === 0) return 0;

  const lastSeen = (await getItem(LAST_SEEN_KEY)) ?? '1970-01-01T00:00:00.000Z';
  const { count } = await supabase
    .from('reactions')
    .select('id', { count: 'exact', head: true })
    .in('voice_id', ids)
    .gt('created_at', lastSeen);
  return count ?? 0;
}

/** Marca las novedades como vistas (ahora). */
export async function markActivitySeen(): Promise<void> {
  await setItem(LAST_SEEN_KEY, new Date().toISOString());
}

/** Estadísticas del usuario para la pantalla de Novedades / perfil. */
export async function getStats(): Promise<Stats> {
  const user = await ensureSession();
  const ids = await myVoiceIds(user.id);

  const [sentRes, receivedRes] = await Promise.all([
    supabase
      .from('voices')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id),
    supabase
      .from('voices')
      .select('id', { count: 'exact', head: true })
      .eq('claimed_by', user.id),
  ]);

  let reactions = 0;
  if (ids.length > 0) {
    const { count } = await supabase
      .from('reactions')
      .select('id', { count: 'exact', head: true })
      .in('voice_id', ids);
    reactions = count ?? 0;
  }

  const { data: recv } = await supabase
    .from('voices')
    .select('country')
    .eq('claimed_by', user.id);
  const countries = new Set(
    (recv ?? []).map((r) => r.country).filter((c): c is string => !!c)
  ).size;

  return {
    sent: sentRes.count ?? 0,
    received: receivedRes.count ?? 0,
    reactions,
    countries,
    streakBest: await getStreakBest(),
  };
}

/** "hace 3 h", "hace 2 d", "ahora"… */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'ahora';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  const w = Math.floor(d / 7);
  return `hace ${w} sem`;
}
