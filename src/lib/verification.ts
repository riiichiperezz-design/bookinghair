import { ensureSession } from './session';
import { supabase } from './supabase';

export type TipoVerificacion = 'verificado' | 'empresa';
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada';

/** Envía una solicitud de verificación (famoso) o de cuenta de empresa. */
export async function requestVerification(
  tipo: TipoVerificacion,
  enlace: string,
  nota: string
): Promise<void> {
  const user = await ensureSession();
  const { error } = await supabase.from('solicitudes_verificacion').insert({
    user_id: user.id,
    tipo,
    enlace: enlace.trim() || null,
    nota: nota.trim() || null,
  });
  if (error) throw error;
}

/** Estado de tu última solicitud (o null si nunca has pedido). */
export async function getMyVerification(): Promise<{
  tipo: TipoVerificacion;
  estado: EstadoSolicitud;
} | null> {
  const user = await ensureSession();
  const { data } = await supabase
    .from('solicitudes_verificacion')
    .select('tipo, estado')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { tipo: TipoVerificacion; estado: EstadoSolicitud } | null) ?? null;
}
