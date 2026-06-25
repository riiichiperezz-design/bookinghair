import type { ModeradorContenido, ResultadoModeracion } from './moderador.ts';

/**
 * Esqueleto PREPARADO para producción. NO funcional todavía: faltan los
 * endpoints reales. Lee las claves SOLO de variables de entorno (server-side);
 * nunca incrustar claves ni endpoints inventados aquí.
 *
 * Flujo previsto:
 *   1) Transcribir el audio (voz→texto) con un servicio de transcripción.
 *   2) Analizar la transcripción con un clasificador de texto que detecte:
 *      insultos, amenazas, contenido sexual, acoso, discriminación, spam y
 *      datos personales.
 *   3) Mapear el análisis a una decisión: aprobado / rechazado / revision_humana.
 */
export class ModeradorAPI implements ModeradorContenido {
  // Claves desde entorno (configúralas en los secretos de la Edge Function).
  private readonly transcripcionApiKey =
    Deno.env.get('MODERACION_TRANSCRIPCION_API_KEY') ?? '';
  private readonly clasificadorApiKey =
    Deno.env.get('MODERACION_CLASIFICADOR_API_KEY') ?? '';

  async moderar({ audioUrl }: { audioUrl: string }): Promise<ResultadoModeracion> {
    // 1) TODO: transcribir `audioUrl`.
    //    Ej.: POST <ENDPOINT_TRANSCRIPCION>
    //         headers: { Authorization: `Bearer ${this.transcripcionApiKey}` }
    //         body: { audioUrl }
    //    -> const transcripcion = (await resp.json()).text;
    const transcripcion = '';

    // 2) TODO: clasificar `transcripcion`.
    //    Ej.: POST <ENDPOINT_CLASIFICADOR>
    //         headers: { Authorization: `Bearer ${this.clasificadorApiKey}` }
    //         body: { texto: transcripcion }
    //    -> const analisis = await resp.json();  // { categoria, score, ... }

    // 3) TODO: mapear `analisis` a la decisión final.
    //    Mientras no haya implementación real, derivamos a revisión humana:
    //    NUNCA aprobar a ciegas.
    void audioUrl;
    return {
      decision: 'revision_humana',
      transcripcion,
      categoria: 'sin_clasificar',
      score: 0,
    };
  }
}
