import { getMyProfile } from './profile';
import { ensureSession } from './session';
import { supabase } from './supabase';

const BUCKET = 'voices';

export type Voice = {
  id: string;
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

  const res = await fetch(uri);
  const blob = await res.blob();
  const contentType = blob.type || 'audio/webm';
  const path = `${user.id}/${Date.now()}.${extFromType(contentType)}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType, upsert: false });
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

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(row.audio_path);
  return {
    id: row.id,
    audio_path: row.audio_path,
    duration_ms: row.duration_ms,
    created_at: row.created_at,
    country: row.country ?? sender?.country ?? null,
    username: sender?.username ?? null,
    audioUrl: pub.publicUrl,
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

  return rows.map((r) => {
    const prof = profMap.get(r.sender_id);
    const { data: pub } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(r.audio_path);
    return {
      id: r.id,
      audio_path: r.audio_path,
      duration_ms: r.duration_ms,
      created_at: r.created_at,
      country: r.country ?? prof?.country ?? null,
      username: prof?.username ?? null,
      audioUrl: pub.publicUrl,
    };
  });
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
