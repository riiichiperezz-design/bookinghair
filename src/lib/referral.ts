import { Platform, Share } from 'react-native';

import { track } from './analytics';
import { haptics } from './haptics';
import { logError } from './log';
import { getMyProfile } from './profile';
import { ensureSession } from './session';
import { getItem, setItem } from './storage';
import { supabase } from './supabase';

// TODO: enlace real (web/App Store/Play) cuando esté publicada.
const BASE_URL = 'https://ecco.app';
const PENDING_KEY = 'ecco.pendingRef.v1';

/** Tu código de invitación = tu @usuario. */
export async function getMyReferralCode(): Promise<string | null> {
  const p = await getMyProfile();
  return p?.username ?? null;
}

/** Enlace de invitación con tu código. */
export function referralLink(code: string): string {
  return `${BASE_URL}/?ref=${encodeURIComponent(code)}`;
}

/**
 * Captura ?ref=<código> de la URL (web) y lo guarda para canjearlo tras el
 * alta. En nativo llega por deep-link; se puede guardar igual con setPendingRef.
 */
export function captureRefFromUrl(): void {
  if (Platform.OS !== 'web') return;
  try {
    if (typeof window === 'undefined') return;
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) setItem(PENDING_KEY, ref);
  } catch (e) {
    logError('referral.capture', e);
  }
}

export async function setPendingRef(code: string): Promise<void> {
  await setItem(PENDING_KEY, code);
}

/**
 * Canjea el código pendiente (si hay). Da +1 crédito al nuevo usuario y a quien
 * invitó. Se llama una sola vez, justo después de crear el perfil.
 */
export async function redeemPendingReferral(): Promise<boolean> {
  const code = await getItem(PENDING_KEY);
  if (!code) return false;
  await setItem(PENDING_KEY, ''); // no reintentar
  try {
    await ensureSession();
    const { data, error } = await supabase.rpc('redeem_referral', {
      p_code: code,
    });
    if (error) throw error;
    if (data === true) {
      haptics.success();
      track('referral_redeemed', { code });
      return true;
    }
    return false;
  } catch (e) {
    logError('referral.redeem', e);
    return false;
  }
}

/** Comparte tu enlace de invitación por la hoja del sistema. */
export async function shareReferral(): Promise<void> {
  haptics.tap();
  const code = await getMyReferralCode();
  const link = code ? referralLink(code) : BASE_URL;
  try {
    await Share.share({
      message:
        'Te mando una voz en ecco 🔥 Mandas un audio y recibes el de un ' +
        'desconocido del mundo. Entra con mi enlace y los dos ganamos una ' +
        `voz extra 👉 ${link}`,
    });
  } catch {
    // cancelado
  }
}
