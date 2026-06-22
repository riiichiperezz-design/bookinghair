/**
 * Sistema de diseño de ecco — tema "brasa".
 * Tokens centralizados de color, espaciado, radios y tipografía,
 * extraídos de los mockups de diseño.
 */

export const colors = {
  // Fondo (gradiente brasa)
  bgTop: '#2A1109',
  bgMid: '#1A0B06',
  bgBottom: '#140805',

  // Superficies / cards
  surface: '#23100a',
  surfaceElevated: '#3a1b10',

  // Acento brasa
  ember: '#E8602C',
  emberBright: '#FF7A3D',
  emberSoft: '#F2814E',
  emberDeep: '#c95a2a',

  // Texto
  textPrimary: '#FBEDE4',
  textSecondary: '#b88663',
  textMuted: '#8a5d40',
  textOnEmber: '#1A0B06',

  // Bordes
  border: '#3a2015',
  borderStrong: '#5a3322',
} as const;

export const fonts = {
  // Titulares — Hanken Grotesk
  display: 'HankenGrotesk_900Black',
  displayBold: 'HankenGrotesk_800ExtraBold',
  bodyBold: 'HankenGrotesk_700Bold',
  bodyMedium: 'HankenGrotesk_500Medium',
  body: 'HankenGrotesk_400Regular',
  // Etiquetas / acentos — Space Grotesk
  label: 'SpaceGrotesk_500Medium',
  labelBold: 'SpaceGrotesk_700Bold',
  labelRegular: 'SpaceGrotesk_400Regular',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;
