import { ensureSession } from './session';
import { supabase } from './supabase';

export type ColaItem = {
  audio_id: string;
  audio_path: string;
  motivo: string | null;
  transcripcion: string | null;
  estado_moderacion: string;
  creado_en: string;
};

export type IncidenciaItem = {
  audio_id: string;
  audio_path: string;
  transcripcion: string | null;
  estado_moderacion: string;
  num: number;
  ultimo: string;
};

/** ¿El usuario actual es administrador/moderador? (RPC segura) */
export async function isAdmin(): Promise<boolean> {
  await ensureSession();
  const { data } = await supabase.rpc('is_admin');
  return data === true;
}

/** Cola de revisión humana (solo admin). */
export async function fetchCola(): Promise<ColaItem[]> {
  const { data, error } = await supabase.rpc('admin_queue');
  if (error) throw error;
  return (data ?? []) as ColaItem[];
}

/** Incidencias reportadas por usuarios (solo admin). */
export async function fetchIncidencias(): Promise<IncidenciaItem[]> {
  const { data, error } = await supabase.rpc('admin_incidencias');
  if (error) throw error;
  return (data ?? []) as IncidenciaItem[];
}

/** Aprueba o rechaza un audio y resuelve su cola/incidencias (solo admin). */
export async function resolveAudio(
  audioId: string,
  decision: 'aprobado' | 'rechazado'
) {
  const { error } = await supabase.rpc('admin_resolve', {
    p_audio_id: audioId,
    p_decision: decision,
  });
  if (error) throw error;
}

/** URL firmada para reproducir un audio en el panel (los admins pueden firmar). */
export async function adminSignedUrl(path: string): Promise<string> {
  const { data } = await supabase.storage
    .from('voices')
    .createSignedUrl(path, 600);
  return data?.signedUrl ?? '';
}
