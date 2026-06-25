import type { ModeradorContenido, ResultadoModeracion } from './moderador.ts';
import {
  type CategoriaModeracion,
  evaluarCategorias,
} from './categorias.ts';

/**
 * Esqueleto PREPARADO para producción. NO funcional todavía: faltan los
 * endpoints reales. Lee las claves SOLO de variables de entorno (server-side);
 * nunca incrustar claves ni endpoints inventados aquí.
 *
 * Flujo previsto:
 *   1) Transcribir el audio (voz→texto).
 *   2) Analizar el SIGNIFICADO e INTENCIÓN del mensaje completo (no listas de
 *      palabras) y devolver las categorías detectadas de la política de ECCO
 *      (ver categorias.ts): explotacion_sexual_infantil, contenido_sexual_explicito,
 *      amenazas_violencia, acoso_bullying, odio_discriminacion, autolesion_suicidio,
 *      datos_personales, spam_estafa, actividades_ilegales, suplantacion.
 *   3) `evaluarCategorias` aplica la acción MÁS SEVERA y decide el estado.
 *
 * Reglas:
 *   - Si hay varias categorías, gana la más severa (lo hace evaluarCategorias).
 *   - Ante duda razonable en categorías graves → 'revision_humana', nunca aprobar.
 *   - La categoría detectada se devuelve como `categoria` (se guarda en
 *     motivo_moderacion para la cola y el panel).
 */
export class ModeradorAPI implements ModeradorContenido {
  private readonly transcripcionApiKey =
    Deno.env.get('MODERACION_TRANSCRIPCION_API_KEY') ?? '';
  private readonly clasificadorApiKey =
    Deno.env.get('MODERACION_CLASIFICADOR_API_KEY') ?? '';

  async moderar({ audioUrl }: { audioUrl: string }): Promise<ResultadoModeracion> {
    // 1) TODO: transcribir `audioUrl` con el servicio de voz→texto.
    //    POST <ENDPOINT_TRANSCRIPCION>  Authorization: Bearer ${this.transcripcionApiKey}
    const transcripcion = '';

    // 2) TODO: clasificar el SIGNIFICADO de `transcripcion` con el clasificador.
    //    POST <ENDPOINT_CLASIFICADOR>  Authorization: Bearer ${this.clasificadorApiKey}
    //    -> mapear la respuesta a categorías de la política:
    const categoriasDetectadas: CategoriaModeracion[] = [];

    // 3) Decisión a partir de la política (cuando la clasificación sea real):
    //    const { decision, categoria } = evaluarCategorias(categoriasDetectadas);
    //    return { decision, categoria: categoria ?? undefined, transcripcion };

    // Mientras NO esté implementada la clasificación real, NO aprobamos a ciegas:
    // derivamos a revisión humana.
    void audioUrl;
    void this.transcripcionApiKey;
    void this.clasificadorApiKey;
    void evaluarCategorias;
    void categoriasDetectadas;
    return {
      decision: 'revision_humana',
      transcripcion,
      categoria: 'sin_clasificar',
      score: 0,
    };
  }
}
