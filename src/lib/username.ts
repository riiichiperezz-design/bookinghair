import { t } from './i18n';

// Lista de raíces ofensivas/no permitidas (ES + EN). Se comprueba por inclusión
// tras normalizar, así que cubre variantes (p. ej. "putaXX", "xx_puta").
const BLOCKED = [
  'puta', 'puto', 'zorra', 'mierda', 'gilipoll', 'cabron', 'polla', 'coño',
  'joder', 'maricon', 'marica', 'nazi', 'hitler', 'violad', 'pedofil',
  'pedo', 'pederast', 'racist', 'negrata', 'sudaca', 'retras',
  'fuck', 'shit', 'bitch', 'cunt', 'nigg', 'rape', 'faggot', 'whore',
  'slut', 'porn', 'sex', 'nazi', 'kill', 'kys',
];

// Nombres reservados: no queremos que nadie se haga pasar por la marca o el staff.
const RESERVED = [
  'ecco', 'admin', 'administrador', 'moderador', 'soporte', 'support',
  'staff', 'official', 'oficial', 'ayuda', 'help', 'root', 'system',
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't');
}

/**
 * Valida un @usuario. Devuelve null si es válido, o un mensaje de error.
 * (El formato 3–20 [a-z0-9_] se valida aparte con el regex del formulario.)
 */
export function checkUsername(username: string): string | null {
  const n = normalize(username);
  if (RESERVED.includes(n)) return t('user.reserved');
  if (BLOCKED.some((w) => n.includes(w))) return t('user.offensive');
  if (/^_+$/.test(username) || /^[0-9_]+$/.test(username)) {
    return t('user.needsLetters');
  }
  return null;
}
