/** Lista curada de países (con bandera y código ISO) para elegir en el perfil. */
export type Country = { name: string; flag: string; code: string };

export const COUNTRIES: Country[] = [
  { name: 'España', flag: '🇪🇸', code: 'ES' },
  { name: 'México', flag: '🇲🇽', code: 'MX' },
  { name: 'Argentina', flag: '🇦🇷', code: 'AR' },
  { name: 'Colombia', flag: '🇨🇴', code: 'CO' },
  { name: 'Chile', flag: '🇨🇱', code: 'CL' },
  { name: 'Perú', flag: '🇵🇪', code: 'PE' },
  { name: 'Ecuador', flag: '🇪🇨', code: 'EC' },
  { name: 'Venezuela', flag: '🇻🇪', code: 'VE' },
  { name: 'Uruguay', flag: '🇺🇾', code: 'UY' },
  { name: 'Paraguay', flag: '🇵🇾', code: 'PY' },
  { name: 'Bolivia', flag: '🇧🇴', code: 'BO' },
  { name: 'Guatemala', flag: '🇬🇹', code: 'GT' },
  { name: 'Honduras', flag: '🇭🇳', code: 'HN' },
  { name: 'El Salvador', flag: '🇸🇻', code: 'SV' },
  { name: 'Nicaragua', flag: '🇳🇮', code: 'NI' },
  { name: 'Costa Rica', flag: '🇨🇷', code: 'CR' },
  { name: 'Panamá', flag: '🇵🇦', code: 'PA' },
  { name: 'Rep. Dominicana', flag: '🇩🇴', code: 'DO' },
  { name: 'Cuba', flag: '🇨🇺', code: 'CU' },
  { name: 'Puerto Rico', flag: '🇵🇷', code: 'PR' },
  { name: 'Estados Unidos', flag: '🇺🇸', code: 'US' },
  { name: 'Brasil', flag: '🇧🇷', code: 'BR' },
  { name: 'Portugal', flag: '🇵🇹', code: 'PT' },
];

/** Devuelve la bandera de un país por nombre, o cadena vacía. */
export function flagFor(country: string | null | undefined): string {
  if (!country) return '';
  return COUNTRIES.find((c) => c.name === country)?.flag ?? '';
}

/** Intenta deducir el país por la región del dispositivo (o null). */
export function detectCountry(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Localization = require('expo-localization');
    const locales = Localization.getLocales?.() ?? [];
    const region: string | undefined = locales[0]?.regionCode ?? undefined;
    if (!region) return null;
    return COUNTRIES.find((c) => c.code === region)?.name ?? null;
  } catch {
    return null;
  }
}
