import type { ModeradorContenido } from './moderador.ts';
import { ModeradorStub } from './moderador-stub.ts';
import { ModeradorAPI } from './moderador-api.ts';

// ── ÚNICO PUNTO DE CONFIGURACIÓN ──
// Usa el moderador REAL si están las claves (GROQ_API_KEY + OPENAI_API_KEY),
// salvo que se fuerce con MODERADOR_IMPL ('stub' | 'api').
const forzado = Deno.env.get('MODERADOR_IMPL') as 'stub' | 'api' | undefined;
const hayClaves = !!Deno.env.get('GROQ_API_KEY') && !!Deno.env.get('OPENAI_API_KEY');
const IMPL: 'stub' | 'api' = forzado ?? (hayClaves ? 'api' : 'stub');

export const moderador: ModeradorContenido =
  IMPL === 'api' ? new ModeradorAPI() : new ModeradorStub();
