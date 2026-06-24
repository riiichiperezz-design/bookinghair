import { Share } from 'react-native';

import { haptics } from './haptics';

// TODO: sustituir por el enlace real (web/App Store/Play) cuando esté publicada.
const INVITE_URL = 'https://ecco.app';

/** Abre la hoja de compartir del sistema para invitar a ecco. */
export async function inviteFriends(): Promise<void> {
  haptics.tap();
  try {
    await Share.share({
      message:
        'En ecco mandas una voz y recibes la de un desconocido del mundo 🔥 ' +
        'Una voz única, para una sola persona. ' +
        `Pruébala 👉 ${INVITE_URL}`,
    });
  } catch {
    // cancelado por el usuario
  }
}
