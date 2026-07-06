import { shareReferral } from './referral';

/**
 * Invita a ecco. Comparte tu enlace con código de referido para que, cuando
 * alguien entre, los dos ganéis una voz extra.
 */
export async function inviteFriends(): Promise<void> {
  await shareReferral();
}
