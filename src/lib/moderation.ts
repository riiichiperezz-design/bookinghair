import { ensureSession } from './session';
import { supabase } from './supabase';

/** Reporta una voz (no volverás a recibirla; con 3+ reportes se oculta a todos). */
export async function reportVoice(voiceId: string, reason?: string) {
  const user = await ensureSession();
  await supabase
    .from('reports')
    .upsert(
      { voice_id: voiceId, reporter_id: user.id, reason: reason ?? null },
      { onConflict: 'voice_id,reporter_id' }
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
