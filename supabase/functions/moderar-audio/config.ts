import type { ModeradorContenido } from './moderador.ts';
import { ModeradorStub } from './moderador-stub.ts';
import { ModeradorAPI } from './moderador-api.ts';

// ── ÚNICO PUNTO DE CONFIGURACIÓN ──
// Cambia a 'api' (o define MODERADOR_IMPL=api en los secretos) cuando el
// ModeradorAPI esté listo. No hay que tocar nada más del sistema.
const IMPL = (Deno.env.get('MODERADOR_IMPL') as 'stub' | 'api') ?? 'stub';

export const moderador: ModeradorContenido =
  IMPL === 'api' ? new ModeradorAPI() : new ModeradorStub();
