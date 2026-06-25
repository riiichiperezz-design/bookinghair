import { ensureSession } from './session';
import { supabase } from './supabase';

/** Reporta una voz (incidencia). No volverás a recibirla; con 3+ se oculta a todos. */
export async function reportVoice(voiceId: string, reason?: string) {
  const user = await ensureSession();
  await supabase
    .from('incidencias')
    .upsert(
      { audio_id: voiceId, reportante_id: user.id, motivo: reason ?? null },
      { onConflict: 'audio_id,reportante_id' }
    );
}

/** Bloquea a quien envió una voz: no volverás a recibir nada suyo. */
export async function blockSender(senderId: string) {
  const user = await ensureSession();
  await supabase
    .from('blocks')
    .upsert(
      { blocker_id: user.id, blocked_id: senderId },
      { onConflict: 'blocker_id,blocked_id' }
    );
}
