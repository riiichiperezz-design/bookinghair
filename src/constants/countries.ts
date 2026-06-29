/** País con bandera, código ISO y centroide aproximado (lat/lng) para el mapa. */
export type Country = {
  name: string;
  flag: string;
  code: string;
  lat: number;
  lng: number;
};

// Lista global con centroides aproximados. Cubre todos los continentes para que
// el mapa interactivo permita elegir "cualquier parte del mundo".
export const COUNTRIES: Country[] = [
  // ── América ──
  { name: 'España', flag: '🇪🇸', code: 'ES', lat: 40.4, lng: -3.7 },
  { name: 'México', flag: '🇲🇽', code: 'MX', lat: 23.6, lng: -102.5 },
  { name: 'Argentina', flag: '🇦🇷', code: 'AR', lat: -38.4, lng: -63.6 },
  { name: 'Colombia', flag: '🇨🇴', code: 'CO', lat: 4.6, lng: -74.3 },
  { name: 'Chile', flag: '🇨🇱', code: 'CL', lat: -35.7, lng: -71.5 },
  { name: 'Perú', flag: '🇵🇪', code: 'PE', lat: -9.2, lng: -75.0 },
  { name: 'Ecuador', flag: '🇪🇨', code: 'EC', lat: -1.8, lng: -78.2 },
  { name: 'Venezuela', flag: '🇻🇪', code: 'VE', lat: 6.4, lng: -66.6 },
  { name: 'Uruguay', flag: '🇺🇾', code: 'UY', lat: -32.5, lng: -55.8 },
  { name: 'Paraguay', flag: '🇵🇾', code: 'PY', lat: -23.4, lng: -58.4 },
  { name: 'Bolivia', flag: '🇧🇴', code: 'BO', lat: -16.3, lng: -63.6 },
  { name: 'Guatemala', flag: '🇬🇹', code: 'GT', lat: 15.8, lng: -90.2 },
  { name: 'Honduras', flag: '🇭🇳', code: 'HN', lat: 15.2, lng: -86.2 },
  { name: 'El Salvador', flag: '🇸🇻', code: 'SV', lat: 13.8, lng: -88.9 },
  { name: 'Nicaragua', flag: '🇳🇮', code: 'NI', lat: 12.9, lng: -85.2 },
  { name: 'Costa Rica', flag: '🇨🇷', code: 'CR', lat: 9.7, lng: -83.8 },
  { name: 'Panamá', flag: '🇵🇦', code: 'PA', lat: 8.5, lng: -80.8 },
  { name: 'Rep. Dominicana', flag: '🇩🇴', code: 'DO', lat: 18.7, lng: -70.2 },
  { name: 'Cuba', flag: '🇨🇺', code: 'CU', lat: 21.5, lng: -79.5 },
  { name: 'Puerto Rico', flag: '🇵🇷', code: 'PR', lat: 18.2, lng: -66.5 },
  { name: 'Estados Unidos', flag: '🇺🇸', code: 'US', lat: 39.8, lng: -98.6 },
  { name: 'Canadá', flag: '🇨🇦', code: 'CA', lat: 56.1, lng: -106.3 },
  { name: 'Brasil', flag: '🇧🇷', code: 'BR', lat: -14.2, lng: -51.9 },
  // ── Europa ──
  { name: 'Portugal', flag: '🇵🇹', code: 'PT', lat: 39.4, lng: -8.2 },
  { name: 'Francia', flag: '🇫🇷', code: 'FR', lat: 46.6, lng: 2.2 },
  { name: 'Italia', flag: '🇮🇹', code: 'IT', lat: 41.9, lng: 12.6 },
  { name: 'Reino Unido', flag: '🇬🇧', code: 'GB', lat: 54.0, lng: -2.0 },
  { name: 'Irlanda', flag: '🇮🇪', code: 'IE', lat: 53.4, lng: -8.2 },
  { name: 'Alemania', flag: '🇩🇪', code: 'DE', lat: 51.2, lng: 10.4 },
  { name: 'Países Bajos', flag: '🇳🇱', code: 'NL', lat: 52.1, lng: 5.3 },
  { name: 'Bélgica', flag: '🇧🇪', code: 'BE', lat: 50.5, lng: 4.5 },
  { name: 'Suiza', flag: '🇨🇭', code: 'CH', lat: 46.8, lng: 8.2 },
  { name: 'Austria', flag: '🇦🇹', code: 'AT', lat: 47.5, lng: 14.6 },
  { name: 'Polonia', flag: '🇵🇱', code: 'PL', lat: 51.9, lng: 19.1 },
  { name: 'Suecia', flag: '🇸🇪', code: 'SE', lat: 60.1, lng: 18.6 },
  { name: 'Noruega', flag: '🇳🇴', code: 'NO', lat: 60.5, lng: 8.5 },
  { name: 'Dinamarca', flag: '🇩🇰', code: 'DK', lat: 56.3, lng: 9.5 },
  { name: 'Finlandia', flag: '🇫🇮', code: 'FI', lat: 61.9, lng: 25.7 },
  { name: 'Grecia', flag: '🇬🇷', code: 'GR', lat: 39.1, lng: 21.8 },
  { name: 'Rumanía', flag: '🇷🇴', code: 'RO', lat: 45.9, lng: 24.9 },
  { name: 'Ucrania', flag: '🇺🇦', code: 'UA', lat: 48.4, lng: 31.2 },
  { name: 'Rusia', flag: '🇷🇺', code: 'RU', lat: 61.5, lng: 90.0 },
  { name: 'Turquía', flag: '🇹🇷', code: 'TR', lat: 38.9, lng: 35.2 },
  // ── África ──
  { name: 'Marruecos', flag: '🇲🇦', code: 'MA', lat: 31.8, lng: -7.1 },
  { name: 'Argelia', flag: '🇩🇿', code: 'DZ', lat: 28.0, lng: 1.7 },
  { name: 'Túnez', flag: '🇹🇳', code: 'TN', lat: 33.9, lng: 9.6 },
  { name: 'Egipto', flag: '🇪🇬', code: 'EG', lat: 26.8, lng: 30.8 },
  { name: 'Nigeria', flag: '🇳🇬', code: 'NG', lat: 9.1, lng: 8.7 },
  { name: 'Ghana', flag: '🇬🇭', code: 'GH', lat: 7.9, lng: -1.0 },
  { name: 'Kenia', flag: '🇰🇪', code: 'KE', lat: -0.0, lng: 37.9 },
  { name: 'Etiopía', flag: '🇪🇹', code: 'ET', lat: 9.1, lng: 40.5 },
  { name: 'Sudáfrica', flag: '🇿🇦', code: 'ZA', lat: -30.6, lng: 22.9 },
  { name: 'Senegal', flag: '🇸🇳', code: 'SN', lat: 14.5, lng: -14.5 },
  { name: 'Camerún', flag: '🇨🇲', code: 'CM', lat: 7.4, lng: 12.4 },
  { name: 'Angola', flag: '🇦🇴', code: 'AO', lat: -11.2, lng: 17.9 },
  // ── Asia / Oriente Medio ──
  { name: 'India', flag: '🇮🇳', code: 'IN', lat: 20.6, lng: 79.0 },
  { name: 'Pakistán', flag: '🇵🇰', code: 'PK', lat: 30.4, lng: 69.3 },
  { name: 'China', flag: '🇨🇳', code: 'CN', lat: 35.9, lng: 104.2 },
  { name: 'Japón', flag: '🇯🇵', code: 'JP', lat: 36.2, lng: 138.3 },
  { name: 'Corea del Sur', flag: '🇰🇷', code: 'KR', lat: 35.9, lng: 127.8 },
  { name: 'Indonesia', flag: '🇮🇩', code: 'ID', lat: -0.8, lng: 113.9 },
  { name: 'Filipinas', flag: '🇵🇭', code: 'PH', lat: 12.9, lng: 121.8 },
  { name: 'Tailandia', flag: '🇹🇭', code: 'TH', lat: 15.9, lng: 100.9 },
  { name: 'Vietnam', flag: '🇻🇳', code: 'VN', lat: 14.1, lng: 108.3 },
  { name: 'Arabia Saudí', flag: '🇸🇦', code: 'SA', lat: 23.9, lng: 45.1 },
  { name: 'Emiratos Árabes', flag: '🇦🇪', code: 'AE', lat: 23.4, lng: 53.8 },
  { name: 'Israel', flag: '🇮🇱', code: 'IL', lat: 31.0, lng: 34.9 },
  { name: 'Irán', flag: '🇮🇷', code: 'IR', lat: 32.4, lng: 53.7 },
  // ── Oceanía ──
  { name: 'Australia', flag: '🇦🇺', code: 'AU', lat: -25.3, lng: 133.8 },
  { name: 'Nueva Zelanda', flag: '🇳🇿', code: 'NZ', lat: -40.9, lng: 174.9 },
];

const BY_NAME = new Map(COUNTRIES.map((c) => [c.name, c]));
const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

/** Devuelve la bandera de un país por nombre, o cadena vacía. */
export function flagFor(country: string | null | undefined): string {
  if (!country) return '';
  return BY_NAME.get(country)?.flag ?? '';
}

/** País por código ISO (o null). */
export function countryByCode(code: string | null | undefined): Country | null {
  if (!code) return null;
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

/** País cuyo centroide está más cerca de unas coordenadas (para el mapa/GPS). */
export function nearestCountry(lat: number, lng: number): Country {
  let best = COUNTRIES[0];
  let bestD = Infinity;
  for (const c of COUNTRIES) {
    // distancia angular sencilla (suficiente para elegir país)
    const dLat = c.lat - lat;
    const dLng = ((c.lng - lng + 540) % 360) - 180; // normaliza el meridiano
    const d = dLat * dLat + dLng * dLng;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Intenta deducir el país por la región del dispositivo (o null). */
export function detectCountry(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Localization = require('expo-localization');
    const locales = Localization.getLocales?.() ?? [];
    const region: string | undefined = locales[0]?.regionCode ?? undefined;
    if (!region) return null;
    return BY_CODE.get(region)?.name ?? null;
  } catch {
    return null;
  }
}
