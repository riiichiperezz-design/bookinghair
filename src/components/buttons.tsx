import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

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
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
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
    </Pressable>
  );
}

type GhostButtonProps = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
};

export function GhostButton({ label, onPress }: GhostButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
    >
      <Text style={styles.ghostLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    height: 56,
    backgroundColor: colors.ember,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryLabel: {
    color: '#ffffff',
    fontFamily: fonts.displayBold,
    fontSize: 16,
  },
  ghost: {
    height: 50,
    backgroundColor: 'transparent',
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
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.ember,
    fontFamily: fonts.labelBold,
    fontSize: 10,
  },
});
