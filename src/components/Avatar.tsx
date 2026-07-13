import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, fonts } from '@/theme';

export type Badge = 'verificado' | 'empresa' | null;

type Props = {
  /** Nombre o @usuario para derivar la inicial (fallback sin foto). */
  name: string;
  size?: number;
  /** Foto de perfil (si la hay). */
  uri?: string | null;
  /** Insignia: verificado (famoso) o empresa. */
  badge?: Badge;
};

function initials(name: string) {
  const clean = name.replace(/^@/, '').trim();
  return clean.slice(0, 1).toUpperCase() || '?';
}

/** Avatar circular con anillo brasa, foto opcional e insignia opcional. */
export function Avatar({ name, size = 92, uri, badge }: Props) {
  const badgeSize = Math.max(18, Math.round(size * 0.3));
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: badge === 'empresa' ? colors.emberBright : colors.ember,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: size - 4, height: size - 4, borderRadius: size / 2 }}
          />
        ) : (
          <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
            {initials(name)}
          </Text>
        )}
      </View>

      {badge && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: badge === 'empresa' ? colors.emberBright : '#3897F0',
            },
          ]}
        >
          {badge === 'verificado' ? (
            <Svg
              width={badgeSize * 0.62}
              height={badgeSize * 0.62}
              viewBox="0 0 24 24"
              fill="none"
            >
              <Path
                d="M5 12.5l4 4 10-10"
                stroke="#ffffff"
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : (
            <Svg
              width={badgeSize * 0.6}
              height={badgeSize * 0.6}
              viewBox="0 0 24 24"
              fill="none"
            >
              <Path d="M4 20V9l8-5 8 5v11h-6v-6h-4v6H4Z" fill="#1A0B06" />
            </Svg>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontFamily: fonts.display,
    color: colors.textPrimary,
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: colors.bgBottom,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
