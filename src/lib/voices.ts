import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { getMyProfile } from './profile';
import { ensureSession } from './session';
import { supabase } from './supabase';

const BUCKET = 'voices';
const SIGNED_TTL = 60 * 60; // 1 h

/** URL firmada para reproducir un audio del bucket privado. */
async function signedUrl(path: string): Promise<string> {
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_TTL);
  return data?.signedUrl ?? '';
}

/** URLs firmadas en lote (mantiene el orden de `paths`). */
async function signedUrls(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_TTL);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) out.set(item.path, item.signedUrl);
  }
  return out;
}

const AUDIO_TYPES: Record<string, string> = {
  webm: 'audio/webm',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  caf: 'audio/x-caf',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
};

/** Deduce el content-type de un audio a partir de la extensión de su uri. */
function contentTypeFromUri(uri: string): string {
  const clean = uri.split('?')[0].toLowerCase();
  const ext = clean.split('.').pop() ?? '';
  return AUDIO_TYPES[ext] ?? 'audio/mp4';
}

export type Voice = {
  id: string;
  senderId: string;
  audio_path: string;
  duration_ms: number;
  country: string | null;
  created_at: string;
  audioUrl: string;
  username: string | null;
};

function extFromType(type: string) {
  if (type.includes('webm')) return 'webm';
  if (type.includes('mp4') || type.includes('m4a') || type.includes('aac')) {
    return 'm4a';
  }
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3';
  if (type.includes('wav')) return 'wav';
  return 'audio';
}

/** Sube la grabación a Storage y crea la fila en `voices` (entra al pool). */
export async function uploadVoice(uri: string, durationMs: number) {
  const user = await ensureSession();
  const profile = await getMyProfile();

  // Web: el uri es un blob: y fetch().blob() funciona. Nativo: hay que leer el
  // fichero file:// con expo-file-system y subir el ArrayBuffer.
  let body: Blob | ArrayBuffer;
  let contentType: string;
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    body = blob;
    contentType = blob.type || 'audio/webm';
  } else {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    body = decodeBase64(base64);
    contentType = contentTypeFromUri(uri);
  }

  const path = `${user.id}/${Date.now()}.${extFromType(contentType)}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType, upsert: false });
  if (upErr) throw upErr;

  const { error: insErr } = await supabase.from('voices').insert({
    sender_id: user.id,
    audio_path: path,
    duration_ms: Math.round(durationMs),
    country: profile?.country ?? null,
  });
  if (insErr) throw insErr;
}

/**
 * Créditos para recibir = voces enviadas − voces reclamadas.
 * Mandas una para poder abrir una (intercambio).
 */
export async function getCredits(): Promise<number> {
  const user = await ensureSession();
  const [sent, claimed] = await Promise.all([
    supabase
      .from('voices')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id),
    supabase
      .from('voices')
      .select('id', { count: 'exact', head: true })
      .eq('claimed_by', user.id),
  ]);
  return (sent.count ?? 0) - (claimed.count ?? 0);
}

/**
 * Reclama una voz aleatoria del pool (entrega única). El servidor comprueba los
 * créditos y marca la voz como tuya de forma atómica. Devuelve la voz o null
 * (sin créditos o pool vacío).
 */
export async function claimVoice(): Promise<Voice | null> {
  await ensureSession();
  const { data, error } = await supabase.rpc('claim_voice');
  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as
    | {
        id: string;
        sender_id: string;
        audio_path: string;
        duration_ms: number;
        country: string | null;
        created_at: string;
      }
    | null
    | undefined;
  if (!row) return null;

  const { data: sender } = await supabase
    .from('profiles')
    .select('username, country')
    .eq('id', row.sender_id)
    .maybeSingle();

  return {
    id: row.id,
    senderId: row.sender_id,
    audio_path: row.audio_path,
    duration_ms: row.duration_ms,
    created_at: row.created_at,
    country: row.country ?? sender?.country ?? null,
    username: sender?.username ?? null,
    audioUrl: await signedUrl(row.audio_path),
  };
}

/** Voces que YA has reclamado (tuyas), de la más reciente a la más antigua. */
export async function fetchReceivedVoices(): Promise<Voice[]> {
  const user = await ensureSession();
  const { data, error } = await supabase
    .from('voices')
    .select('id, sender_id, audio_path, duration_ms, country, created_at, claimed_at')
    .eq('claimed_by', user.id)
    .order('claimed_at', { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const senderIds = [...new Set(rows.map((r) => r.sender_id))];
  const { data: profs } = await supabase
    .from('profiles')
    .select('id, username, country')
    .in('id', senderIds);
  const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
  const urls = await signedUrls(rows.map((r) => r.audio_path));

  return rows.map((r) => {
    const prof = profMap.get(r.sender_id);
    return {
      id: r.id,
      senderId: r.sender_id,
      audio_path: r.audio_path,
      duration_ms: r.duration_ms,
      created_at: r.created_at,
      country: r.country ?? prof?.country ?? null,
      username: prof?.username ?? null,
      audioUrl: urls.get(r.audio_path) ?? '',
    };
  });
}

/** Voces sin reclamar dando vueltas por el mundo ahora mismo (señal "viva"). */
export async function waitingCount(): Promise<number> {
  await ensureSession();
  const { data } = await supabase.rpc('waiting_count');
  return (data as number | null) ?? 0;
}

/** Número de voces recibidas (reclamadas) por el usuario. */
export async function receivedCount(): Promise<number> {
  const user = await ensureSession();
  const { count } = await supabase
    .from('voices')
    .select('id', { count: 'exact', head: true })
    .eq('claimed_by', user.id);
  return count ?? 0;
}

export type ReactionCount = { emoji: string; count: number };

export type SentVoice = {
  id: string;
  audio_path: string;
  duration_ms: number;
  created_at: string;
  audioUrl: string;
  claimed: boolean;
  reactions: ReactionCount[];
};

/** Voces que has ENVIADO, con su estado y las reacciones que han recibido. */
export async function fetchSentVoices(): Promise<SentVoice[]> {
  const user = await ensureSession();
  const { data, error } = await supabase
    .from('voices')
    .select('id, audio_path, duration_ms, created_at, claimed_by')
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const { data: reacts } = await supabase
    .from('reactions')
    .select('voice_id, emoji')
    .in('voice_id', ids);

  // Agregamos las reacciones por voz y emoji.
  const byVoice = new Map<string, Map<string, number>>();
  for (const r of reacts ?? []) {
    const m = byVoice.get(r.voice_id) ?? new Map<string, number>();
    m.set(r.emoji, (m.get(r.emoji) ?? 0) + 1);
    byVoice.set(r.voice_id, m);
  }

  const urls = await signedUrls(rows.map((r) => r.audio_path));

  return rows.map((r) => {
    const counts = byVoice.get(r.id);
    const reactions: ReactionCount[] = counts
      ? [...counts.entries()]
          .map(([emoji, count]) => ({ emoji, count }))
          .sort((a, b) => b.count - a.count)
      : [];
    return {
      id: r.id,
      audio_path: r.audio_path,
      duration_ms: r.duration_ms,
      created_at: r.created_at,
      audioUrl: urls.get(r.audio_path) ?? '',
      claimed: r.claimed_by != null,
      reactions,
    };
  });
}

/** Añade/cambia la reacción del usuario a una voz. */
export async function addReaction(voiceId: string, emoji: string) {
  const user = await ensureSession();
  await supabase
    .from('reactions')
    .upsert(
      { voice_id: voiceId, user_id: user.id, emoji },
      { onConflict: 'voice_id,user_id' }
    );
}
