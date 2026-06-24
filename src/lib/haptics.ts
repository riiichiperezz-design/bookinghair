import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS !== 'web';

/** Feedback háptico (no-op en web). */
export const haptics = {
  /** Toque ligero (selección, reacción). */
  tap() {
    if (enabled) Haptics.selectionAsync().catch(() => {});
  },
  /** Impacto medio (grabar, reclamar). */
  impact() {
    if (enabled)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  /** Notificación de éxito (voz enviada). */
  success() {
    if (enabled)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
  },
};
