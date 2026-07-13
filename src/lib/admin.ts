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

export type MetricasSerie = { dia: string; activos: number; enviadas: number };
export type Metricas = {
  usuarios: number;
  dau: number;
  wau: number;
  mau: number;
  enviadas_hoy: number;
  enviadas_7d: number;
  reclamadas_7d: number;
  reacciones_7d: number;
  pct_envia_7d: number;
  serie: MetricasSerie[];
};

/** KPIs de retención (solo admin). */
export async function fetchMetrics(): Promise<Metricas | null> {
  const { data, error } = await supabase.rpc('admin_metrics');
  if (error) throw error;
  if (!data || Object.keys(data).length === 0) return null;
  return data as Metricas;
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

export type SolicitudItem = {
  id: number;
  user_id: string;
  username: string | null;
  tipo: 'verificado' | 'empresa';
  enlace: string | null;
  nota: string | null;
  creado_en: string;
};

/** Solicitudes de verificación pendientes (solo admin). */
export async function fetchVerificaciones(): Promise<SolicitudItem[]> {
  const { data, error } = await supabase.rpc('admin_verificaciones');
  if (error) throw error;
  return (data ?? []) as SolicitudItem[];
}

/** Aprueba (concede insignia) o rechaza una solicitud (solo admin). */
export async function resolveVerificacion(id: number, aprobar: boolean) {
  const { error } = await supabase.rpc('admin_resolver_verificacion', {
    p_id: id,
    p_aprobar: aprobar,
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
