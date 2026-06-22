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

/** Sube la grabación a Storage y crea la fila en `voices`. */
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

async function viewedIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('voice_views')
    .select('voice_id')
    .eq('viewer_id', userId);
  return (data ?? []).map((r) => r.voice_id as string);
}

/**
 * Devuelve una voz ALEATORIA de otra persona que aún no hayas escuchado, o null.
 * El sentido de ecco: recibes un audio único al azar de cualquiera del mundo.
 */
export async function fetchNextVoice(): Promise<Voice | null> {
  const user = await ensureSession();
  const seen = await viewedIds(user.id);

  // 1) Candidatas (solo ids, ligero) de todo el pool, menos las mías y vistas.
  let idQuery = supabase
    .from('voices')
    .select('id')
    .neq('sender_id', user.id)
    .limit(500);

  if (seen.length > 0) {
    idQuery = idQuery.not('id', 'in', `(${seen.join(',')})`);
  }

  const { data: ids, error: idErr } = await idQuery;
  if (idErr) throw idErr;
  if (!ids || ids.length === 0) return null;

  // 2) Elegimos una al azar y traemos la fila completa.
  const pick = ids[Math.floor(Math.random() * ids.length)].id as string;
  const { data: row, error } = await supabase
    .from('voices')
    .select('id, sender_id, audio_path, duration_ms, country, created_at')
    .eq('id', pick)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  // Perfil del remitente (para revelar @usuario y país).
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

/** Marca una voz como vista para no volver a mostrarla. */
export async function markViewed(voiceId: string) {
  const user = await ensureSession();
  await supabase
    .from('voice_views')
    .upsert({ voice_id: voiceId, viewer_id: user.id });
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

/** Número de voces nuevas (de otros, no escuchadas). */
export async function unseenCount(): Promise<number> {
  const user = await ensureSession();
  const seen = await viewedIds(user.id);

  let query = supabase
    .from('voices')
    .select('id', { count: 'exact', head: true })
    .neq('sender_id', user.id);

  if (seen.length > 0) {
    query = query.not('id', 'in', `(${seen.join(',')})`);
  }

  const { count } = await query;
  return count ?? 0;
}
