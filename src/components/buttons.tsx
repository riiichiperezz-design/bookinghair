import { LinearGradient } from 'expo-linear-gradient';
import {
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { haptics } from '@/lib/haptics';
import { colors, fonts, radius } from '@/theme';

type PrimaryButtonProps = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  icon,
  badge,
  disabled,
}: PrimaryButtonProps) {
  return (
    <PressableScale
      disabled={disabled}
      onPress={(e) => {
        haptics.tap();
        onPress?.(e);
      }}
      style={[styles.primaryWrap, disabled ? styles.disabled : styles.glow]}
    >
      <LinearGradient
        colors={[colors.emberBright, colors.ember, colors.emberDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryFill}
      >
        {icon != null && (
          <View>
            {icon}
            {badge != null && badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
        )}
        <Text style={styles.primaryLabel}>{label}</Text>
      </LinearGradient>
    </PressableScale>
  );
}

type GhostButtonProps = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
};

export function GhostButton({ label, onPress }: GhostButtonProps) {
  return (
    <PressableScale
      onPress={(e) => {
        haptics.tap();
        onPress?.(e);
      }}
      style={styles.ghost}
    >
      <Text style={styles.ghostLabel}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  primaryWrap: {
    height: 58,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  glow: {
    shadowColor: colors.ember,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  primaryFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryLabel: {
    color: '#ffffff',
    fontFamily: fonts.displayBold,
    fontSize: 16.5,
    letterSpacing: 0.2,
  },
  ghost: {
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  ghostLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.45,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.emberDeep,
    fontFamily: fonts.labelBold,
    fontSize: 10.5,
  },
});
