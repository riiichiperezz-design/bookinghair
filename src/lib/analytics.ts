import { logError } from './log';
import { ensureSession } from './session';
import { supabase } from './supabase';

export type EventoTipo =
  | 'app_open'
  | 'voice_sent'
  | 'voice_claimed'
  | 'voice_heard'
  | 'reaction'
  | 'referral_redeemed'
  | 'consent_voice_ai';

/**
 * Registra un evento de retención (fire-and-forget). Alimenta los KPIs
 * (D1/D7/D30, % que manda, voces/día). No bloquea la UI ni propaga errores.
 */
export function track(tipo: EventoTipo, meta?: Record<string, unknown>): void {
  (async () => {
    try {
      const user = await ensureSession();
      await supabase
        .from('eventos')
        .insert({ user_id: user.id, tipo, meta: meta ?? null });
    } catch (e) {
      logError('analytics.track', e);
    }
  })();
}
