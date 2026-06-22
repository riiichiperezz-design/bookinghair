/** Lista curada de países (con bandera) para elegir en el perfil. */
export type Country = { name: string; flag: string };

export const COUNTRIES: Country[] = [
  { name: 'España', flag: '🇪🇸' },
  { name: 'México', flag: '🇲🇽' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'Chile', flag: '🇨🇱' },
  { name: 'Perú', flag: '🇵🇪' },
  { name: 'Ecuador', flag: '🇪🇨' },
  { name: 'Venezuela', flag: '🇻🇪' },
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Paraguay', flag: '🇵🇾' },
  { name: 'Bolivia', flag: '🇧🇴' },
  { name: 'Guatemala', flag: '🇬🇹' },
  { name: 'Honduras', flag: '🇭🇳' },
  { name: 'El Salvador', flag: '🇸🇻' },
  { name: 'Nicaragua', flag: '🇳🇮' },
  { name: 'Costa Rica', flag: '🇨🇷' },
  { name: 'Panamá', flag: '🇵🇦' },
  { name: 'Rep. Dominicana', flag: '🇩🇴' },
  { name: 'Cuba', flag: '🇨🇺' },
  { name: 'Puerto Rico', flag: '🇵🇷' },
  { name: 'Estados Unidos', flag: '🇺🇸' },
  { name: 'Brasil', flag: '🇧🇷' },
  { name: 'Portugal', flag: '🇵🇹' },
];

/** Devuelve la bandera de un país por nombre, o cadena vacía. */
export function flagFor(country: string | null | undefined): string {
  if (!country) return '';
  return COUNTRIES.find((c) => c.name === country)?.flag ?? '';
}
