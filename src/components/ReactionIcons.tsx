import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

export type ReactionName = 'me_llega' | 'vibra' | 'jajaja' | 'crack';
export const REACTION_NAMES: ReactionName[] = [
  'me_llega',
  'vibra',
  'jajaja',
  'crack',
];

const CREAM = '#FBEDE4';

// ── Formas SVG (estáticas), reutilizadas por el icono animado y el glyph ──

function MeLlegaSvg({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.5S3.5 14.6 3.5 8.9C3.5 6.2 5.5 4.3 7.9 4.3c1.7 0 3.2 1 4.1 2.5.9-1.5 2.4-2.5 4.1-2.5 2.4 0 4.4 1.9 4.4 4.6 0 5.7-8.5 11.6-8.5 11.6Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M6.5 12h2.2l1.3-2.6 1.8 4.2 1.2-2.4H17"
        stroke={CREAM}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function VibraSvg({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={2.4} fill={color} />
      <Path d="M15.2 9.2a4 4 0 0 1 0 5.6" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M17.6 6.8a7.4 7.4 0 0 1 0 10.4" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M8.8 9.2a4 4 0 0 0 0 5.6" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M6.4 6.8a7.4 7.4 0 0 0 0 10.4" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

function CrackSvg({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 3.5Q12 11 19.5 12Q12 13 11 20.5Q10 13 2.5 12Q10 11 11 3.5Z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <Path d="M19 3.5Q19.5 5.5 21.5 6Q19.5 6.5 19 8.5Q18.5 6.5 16.5 6Q18.5 5.5 19 3.5Z" fill={color} />
    </Svg>
  );
}

// ── Icono ANIMADO (se dispara al cambiar `nonce`) ──

export function ReactionIcon({
  name,
  size = 30,
  color = colors.emberBright,
  nonce,
}: {
  name: ReactionName;
  size?: number;
  color?: string;
  nonce: number;
}) {
  if (name === 'jajaja') return <Jajaja size={size} color={color} nonce={nonce} />;
  if (name === 'vibra') return <Vibra size={size} color={color} nonce={nonce} />;
  if (name === 'crack') return <Crack size={size} color={color} nonce={nonce} />;
  return <MeLlega size={size} color={color} nonce={nonce} />;
}

function MeLlega({ size, color, nonce }: IconProps) {
  const s = useSharedValue(1);
  useEffect(() => {
    if (nonce > 0) {
      s.value = withSequence(
        withTiming(1.3, { duration: 120 }),
        withTiming(1, { duration: 110 }),
        withTiming(1.18, { duration: 110 }),
        withSpring(1, { damping: 6, stiffness: 220 })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={st}>
      <MeLlegaSvg size={size} color={color} />
    </Animated.View>
  );
}

function Vibra({ size, color, nonce }: IconProps) {
  const s = useSharedValue(1);
  const r = useSharedValue(1);
  useEffect(() => {
    if (nonce > 0) {
      s.value = withSequence(
        withTiming(1.2, { duration: 130 }),
        withSpring(1, { damping: 6, stiffness: 220 })
      );
      r.value = 0;
      r.value = withTiming(1, { duration: 620, easing: Easing.out(Easing.ease) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const ring = useAnimatedStyle(() => ({
    opacity: r.value >= 1 ? 0 : (1 - r.value) * 0.6,
    transform: [{ scale: 0.4 + r.value * 1.5 }],
  }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: size * 0.4,
            borderWidth: 2,
            borderColor: color,
          },
          ring,
        ]}
      />
      <Animated.View style={st}>
        <VibraSvg size={size} color={color} />
      </Animated.View>
    </View>
  );
}

function Crack({ size, color, nonce }: IconProps) {
  const s = useSharedValue(1);
  const rot = useSharedValue(0);
  useEffect(() => {
    if (nonce > 0) {
      s.value = withSequence(
        withTiming(1.32, { duration: 150 }),
        withSpring(1, { damping: 5, stiffness: 200 })
      );
      rot.value = withSequence(
        withTiming(-20, { duration: 90 }),
        withTiming(14, { duration: 130 }),
        withSpring(0, { damping: 6, stiffness: 200 })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);
  const st = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }, { rotate: `${rot.value}deg` }],
  }));
  return (
    <Animated.View style={st}>
      <CrackSvg size={size} color={color} />
    </Animated.View>
  );
}

function Jajaja({ size, color, nonce }: IconProps) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (nonce > 0) {
      p.value = 0;
      p.value = withTiming(1, { duration: 750, easing: Easing.linear });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  const bars = [0, 1, 2, 3, 4];
  const baseH = [0.42, 0.7, 1, 0.55, 0.82];
  const barW = size * 0.11;
  const gap = size * 0.07;
  const maxH = size * 0.7;

  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap,
      }}
    >
      {bars.map((i) => (
        <Bar
          key={i}
          p={p}
          phase={i}
          base={baseH[i]}
          width={barW}
          maxH={maxH}
          color={color}
        />
      ))}
    </View>
  );
}

function Bar({
  p,
  phase,
  base,
  width,
  maxH,
  color,
}: {
  p: SharedValue<number>;
  phase: number;
  base: number;
  width: number;
  maxH: number;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    // Onda estilo ecualizador: cada barra oscila con su propia fase.
    const wobble = Math.sin((p.value * 3 + phase * 0.6) * Math.PI * 2);
    const factor = base * (0.7 + 0.3 * (0.5 + 0.5 * wobble)) + p.value * 0 + 0;
    const h = Math.max(0.18, Math.min(1, factor));
    return { height: maxH * h };
  });
  return (
    <Animated.View
      style={[
        {
          width,
          borderRadius: width / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

type IconProps = { size: number; color: string; nonce: number };

// ── Glyph estático pequeño (para chips de recuento) ──
export function ReactionGlyph({
  name,
  size = 14,
  color = colors.emberBright,
}: {
  name: ReactionName;
  size?: number;
  color?: string;
}) {
  if (name === 'me_llega') return <MeLlegaSvg size={size} color={color} />;
  if (name === 'vibra') return <VibraSvg size={size} color={color} />;
  if (name === 'crack') return <CrackSvg size={size} color={color} />;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={9} width={2.6} height={6} rx={1.3} fill={color} />
      <Rect x={8.4} y={5} width={2.6} height={14} rx={1.3} fill={color} />
      <Rect x={12.8} y={8} width={2.6} height={8} rx={1.3} fill={color} />
      <Rect x={17.2} y={6} width={2.6} height={12} rx={1.3} fill={color} />
    </Svg>
  );
}

export const _styles = StyleSheet.create({ noop: {} });
