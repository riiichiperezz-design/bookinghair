import { useEffect, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import { COUNTRIES, type Country, nearestCountry } from '@/constants/countries';
import { haptics } from '@/lib/haptics';
import { colors, radius } from '@/theme';

type Props = {
  selected: string | null; // nombre del país seleccionado
  onSelect: (c: Country) => void;
};

// Proyección equirectangular: lng/lat ⇄ píxel dentro de un lienzo W×H (W=2H).
const lngToX = (lng: number, w: number) => ((lng + 180) / 360) * w;
const latToY = (lat: number, h: number) => ((90 - lat) / 180) * h;
const xToLng = (x: number, w: number) => (x / w) * 360 - 180;
const yToLat = (y: number, h: number) => 90 - (y / h) * 180;

/**
 * Mapa 2D interactivo: cada país es un punto "brasa" sobre un planisferio.
 * Tocas en cualquier parte del mundo y se selecciona el país más cercano.
 */
export function WorldMapPicker({ selected, onSelect }: Props) {
  const [w, setW] = useState(0);
  const h = w / 2;

  const sel = selected ? COUNTRIES.find((c) => c.name === selected) ?? null : null;

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true);
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.55 - pulse.value * 0.45,
    transform: [{ scale: 1 + pulse.value * 1.6 }],
  }));

  const onLayout = (e: LayoutChangeEvent) =>
    setW(e.nativeEvent.layout.width);

  const handleTap = (e: GestureResponderEvent) => {
    if (w === 0) return;
    const { locationX, locationY } = e.nativeEvent;
    const lng = xToLng(Math.max(0, Math.min(w, locationX)), w);
    const lat = yToLat(Math.max(0, Math.min(h, locationY)), h);
    const c = nearestCountry(lat, lng);
    haptics.tap();
    onSelect(c);
  };

  const selX = sel && w ? lngToX(sel.lng, w) : 0;
  const selY = sel && w ? latToY(sel.lat, h) : 0;

  return (
    <View
      style={styles.wrap}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onResponderRelease={handleTap}
    >
      {w > 0 && (
        <>
          <Svg width={w} height={h}>
            <Rect x={0} y={0} width={w} height={h} rx={16} fill={colors.surface} />
            {/* Retícula tenue para dar sensación de mapa */}
            {[0.25, 0.5, 0.75].map((p) => (
              <Line
                key={`v${p}`}
                x1={w * p}
                y1={0}
                x2={w * p}
                y2={h}
                stroke={colors.border}
                strokeWidth={StyleSheet.hairlineWidth}
              />
            ))}
            {[0.5].map((p) => (
              <Line
                key={`h${p}`}
                x1={0}
                y1={h * p}
                x2={w}
                y2={h * p}
                stroke={colors.border}
                strokeWidth={StyleSheet.hairlineWidth}
              />
            ))}
            {/* Un punto brasa por país */}
            {COUNTRIES.map((c) => {
              const isSel = sel?.code === c.code;
              return (
                <Circle
                  key={c.code}
                  cx={lngToX(c.lng, w)}
                  cy={latToY(c.lat, h)}
                  r={isSel ? 5 : 2.4}
                  fill={isSel ? colors.emberBright : colors.ember}
                  opacity={isSel ? 1 : 0.5}
                />
              );
            })}
          </Svg>

          {/* Anillo pulsante sobre el país elegido */}
          {sel && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ring,
                { left: selX - 14, top: selY - 14 },
                ringStyle,
              ]}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 2,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.emberBright,
  },
});
