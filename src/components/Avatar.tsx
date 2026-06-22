import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

type Props = {
  /** Nombre o @usuario para derivar la inicial. */
  name: string;
  size?: number;
};

function initials(name: string) {
  const clean = name.replace(/^@/, '').trim();
  return clean.slice(0, 1).toUpperCase() || '?';
}

/** Avatar circular con anillo brasa. */
export function Avatar({ name, size = 92 }: Props) {
  return (
    <View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fonts.display,
    color: colors.textPrimary,
  },
});
