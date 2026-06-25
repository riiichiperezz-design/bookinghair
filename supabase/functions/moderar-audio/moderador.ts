// Contrato del clasificador de contenido. Pieza SUSTITUIBLE: cualquier
// implementación (stub provisional o API real) cumple esta interfaz, de modo
// que el resto del sistema no cambia al enchufar la moderación real.

export type DecisionModeracion = 'aprobado' | 'rechazado' | 'revision_humana';

export interface ResultadoModeracion {
  decision: DecisionModeracion;
  /** Texto extraído del audio (voz→texto), si lo hubo. */
  transcripcion?: string;
  /** Categoría detectada (insultos, amenazas, sexual, acoso, spam…). */
  categoria?: string;
  /** Confianza/severidad 0–1, opcional. */
  score?: number;
}

export interface ModeradorContenido {
  moderar(input: { audioUrl: string }): Promise<ResultadoModeracion>;
}
