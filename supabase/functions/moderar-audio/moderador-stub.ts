import type { ModeradorContenido, ResultadoModeracion } from './moderador.ts';

/**
 * Implementación PROVISIONAL (la activa por ahora).
 * Aprueba por defecto para no bloquear el desarrollo, pero deja marcado dónde
 * irá la moderación real. NO usar en producción tal cual.
 */
export class ModeradorStub implements ModeradorContenido {
  async moderar({ audioUrl }: { audioUrl: string }): Promise<ResultadoModeracion> {
    // TODO: sustituir por API real —
    //   1) Transcripción del audio (voz→texto) a partir de `audioUrl`.
    //   2) Análisis del texto (insultos, amenazas, sexual, acoso,
    //      discriminación, spam, datos personales).
    // Mientras tanto (solo desarrollo) aprobamos por defecto.
    void audioUrl; // referenciado a propósito: aquí entraría la transcripción real
    return {
      decision: 'aprobado',
      transcripcion: undefined, // TODO: texto transcrito real
      categoria: undefined, // TODO: categoría detectada real
      score: 0,
    };
  }
}
