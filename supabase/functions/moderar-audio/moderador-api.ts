import type { ModeradorContenido, ResultadoModeracion } from './moderador.ts';
import {
  CATEGORIAS_MODERACION as CAT,
  type CategoriaModeracion,
  evaluarCategorias,
} from './categorias.ts';

// Todo con Groq (un solo proveedor, plan gratuito): Whisper para transcribir y
// un modelo de chat para clasificar el significado del mensaje en NUESTRAS
// categorías. Endpoints reales y documentados de Groq.
const GROQ_TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_WHISPER_MODEL = 'whisper-large-v3-turbo';
// Modelo de clasificación. openai/gpt-oss-20b son pesos abiertos alojados en
// Groq (no la API de pago de OpenAI); es el reemplazo vigente recomendado tras
// la deprecación de llama-3.1/3.3 y llama-guard.
const GROQ_MODERATION_MODEL = 'openai/gpt-oss-20b';

function extFromUrl(url: string): string {
  const path = url.split('?')[0];
  const m = path.match(/\.(\w{2,5})$/);
  return m ? m[1] : 'm4a';
}

/** Extrae el primer objeto JSON de un texto (el modelo puede añadir prosa). */
function extraerJSON(s: string): { categorias?: unknown } | null {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

const DESCRIPCION_CATEGORIAS = `
- "${CAT.EXPLOTACION_SEXUAL_INFANTIL}": cualquier contenido sexual que implique a menores de edad.
- "${CAT.CONTENIDO_SEXUAL_EXPLICITO}": contenido sexual explícito entre adultos.
- "${CAT.AMENAZAS_VIOLENCIA}": amenazas de daño físico o incitación a la violencia.
- "${CAT.ACOSO_BULLYING}": acoso, hostigamiento o humillación dirigidos a una persona.
- "${CAT.ODIO_DISCRIMINACION}": odio o discriminación por raza, etnia, religión, género, orientación, discapacidad, etc.
- "${CAT.AUTOLESION_SUICIDIO}": contenido sobre autolesión o suicidio.
- "${CAT.DATOS_PERSONALES}": revela datos que identifican a una persona real (teléfono, dirección, redes, documento).
- "${CAT.SPAM_ESTAFA}": publicidad, captación a otras plataformas, fraude o estafa.
- "${CAT.ACTIVIDADES_ILEGALES}": promueve actividades ilegales (drogas, armas, etc.).
- "${CAT.SUPLANTACION}": se hace pasar por otra persona u organización.`;

/**
 * Moderación real (solo Groq): transcribe con Whisper y clasifica el SIGNIFICADO
 * con un modelo de chat, devolviendo las categorías que incumple.
 *
 * Seguridad: si la transcripción o la clasificación fallan a nivel de API, se
 * LANZA el error (la Edge Function deja el audio 'pendiente'); nunca se aprueba
 * a ciegas. Si la clasificación responde pero no se puede interpretar, va a
 * revisión humana.
 */
export class ModeradorAPI implements ModeradorContenido {
  private readonly groqKey = Deno.env.get('GROQ_API_KEY') ?? '';

  async moderar({ audioUrl }: { audioUrl: string }): Promise<ResultadoModeracion> {
    const transcripcion = (await this.transcribir(audioUrl)).trim();

    // Sin texto reconocible: no aprobar a ciegas → revisión humana.
    if (transcripcion.length === 0) {
      return {
        decision: 'revision_humana',
        transcripcion: '',
        categoria: 'sin_audio_legible',
        score: 0,
      };
    }

    const detectadas = await this.clasificar(transcripcion);

    // El modelo respondió pero no pudimos interpretar la salida: no aprobamos.
    if (detectadas === null) {
      return {
        decision: 'revision_humana',
        transcripcion,
        categoria: 'clasificacion_ambigua',
        score: 0,
      };
    }

    const ev = evaluarCategorias(detectadas);
    return {
      decision: ev.decision,
      transcripcion,
      categoria: ev.categoria ?? undefined,
      score: 0,
    };
  }

  // ── Transcripción (Groq Whisper) ──
  private async transcribir(audioUrl: string): Promise<string> {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error(`audio_no_accesible:${audioRes.status}`);
    const blob = await audioRes.blob();

    const form = new FormData();
    form.append('file', blob, `audio.${extFromUrl(audioUrl)}`);
    form.append('model', GROQ_WHISPER_MODEL);
    form.append('response_format', 'json');

    const res = await fetch(GROQ_TRANSCRIBE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.groqKey}` },
      body: form,
    });
    if (!res.ok) throw new Error(`transcripcion_fallo:${res.status}`);
    const data = await res.json();
    return (data?.text ?? '').toString();
  }

  // ── Clasificación por significado (Groq chat) ──
  // Devuelve las categorías incumplidas, [] si es seguro, o null si la respuesta
  // no se pudo interpretar (el llamador lo trata como revisión humana).
  private async clasificar(
    texto: string,
  ): Promise<CategoriaModeracion[] | null> {
    const sistema =
      'Eres el moderador de ECCO, una app de notas de voz anónimas entre ' +
      'desconocidos. Analiza el SIGNIFICADO y la INTENCIÓN del mensaje (no ' +
      'listas de palabras sueltas) y decide qué categorías de la política ' +
      'incumple. Categorías posibles:' +
      DESCRIPCION_CATEGORIAS +
      '\nResponde SOLO con un objeto JSON {"categorias": [...]} usando ' +
      'EXACTAMENTE esas claves. Si el mensaje es seguro, devuelve ' +
      '{"categorias": []}. No añadas texto fuera del JSON.';

    const res = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODERATION_MODEL,
        temperature: 0,
        messages: [
          { role: 'system', content: sistema },
          { role: 'user', content: texto },
        ],
      }),
    });
    if (!res.ok) throw new Error(`clasificacion_fallo:${res.status}`);

    const data = await res.json();
    const content = (data?.choices?.[0]?.message?.content ?? '').toString();
    const parsed = extraerJSON(content);
    if (!parsed || !Array.isArray(parsed.categorias)) return null;

    const todas = Object.values(CAT) as string[];
    return (parsed.categorias as unknown[]).filter(
      (x): x is CategoriaModeracion =>
        typeof x === 'string' && todas.includes(x),
    );
  }
}
