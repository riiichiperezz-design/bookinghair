import type { ModeradorContenido, ResultadoModeracion } from './moderador.ts';
import {
  CATEGORIAS_MODERACION as CAT,
  type CategoriaModeracion,
  evaluarCategorias,
} from './categorias.ts';

// Modelos (cambiables). Endpoints reales y documentados de cada proveedor.
const GROQ_TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_WHISPER_MODEL = 'whisper-large-v3-turbo';
const GROQ_LLM_MODEL = 'llama-3.1-8b-instant';
const OPENAI_MODERATION_URL = 'https://api.openai.com/v1/moderations';
const OPENAI_MODERATION_MODEL = 'omni-moderation-latest';

function extFromUrl(url: string): string {
  const path = url.split('?')[0];
  const m = path.match(/\.(\w{2,5})$/);
  return m ? m[1] : 'm4a';
}

/**
 * Moderación real: transcribe con Groq (Whisper) y clasifica con la Moderation
 * API de OpenAI (categorías peligrosas, incluido sexual/menores = CSAM) más una
 * pasada con el LLM de Groq para spam / datos personales / suplantación.
 *
 * Seguridad: si la transcripción o la clasificación de OpenAI fallan, se LANZA
 * el error (la Edge Function deja el audio 'pendiente'); nunca se aprueba a
 * ciegas. La pasada de Groq para categorías extra es best-effort.
 */
export class ModeradorAPI implements ModeradorContenido {
  private readonly groqKey = Deno.env.get('GROQ_API_KEY') ?? '';
  private readonly openaiKey = Deno.env.get('OPENAI_API_KEY') ?? '';

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

    const detectadas: CategoriaModeracion[] = [];

    // 1) OpenAI Moderation: categorías peligrosas (debe poder ejecutarse).
    const omod = await this.clasificarOpenAI(transcripcion);
    detectadas.push(...omod.categorias);

    // 2) Groq LLM: spam / datos personales / suplantación (best-effort).
    try {
      detectadas.push(...(await this.clasificarExtrasGroq(transcripcion)));
    } catch {
      // secundario: si falla, seguimos con lo que detectó OpenAI.
    }

    const ev = evaluarCategorias(detectadas);

    // Duda razonable en categorías graves (sin flag claro) → revisión humana.
    if (ev.decision === 'aprobado' && omod.dudaGrave) {
      return {
        decision: 'revision_humana',
        transcripcion,
        categoria: 'duda_grave',
        score: omod.scoreMaxGrave,
      };
    }

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

  // ── Clasificación peligrosa (OpenAI Moderation) ──
  private async clasificarOpenAI(texto: string): Promise<{
    categorias: CategoriaModeracion[];
    dudaGrave: boolean;
    scoreMaxGrave: number;
  }> {
    const res = await fetch(OPENAI_MODERATION_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: OPENAI_MODERATION_MODEL, input: texto }),
    });
    if (!res.ok) throw new Error(`moderacion_openai_fallo:${res.status}`);
    const data = await res.json();
    const r = data?.results?.[0] ?? {};
    const c: Record<string, boolean> = r.categories ?? {};
    const s: Record<string, number> = r.category_scores ?? {};

    const out: CategoriaModeracion[] = [];
    const add = (cat: CategoriaModeracion) => {
      if (!out.includes(cat)) out.push(cat);
    };

    if (c['sexual/minors']) add(CAT.EXPLOTACION_SEXUAL_INFANTIL);
    if (c['sexual']) add(CAT.CONTENIDO_SEXUAL_EXPLICITO);
    if (c['violence'] || c['violence/graphic'] || c['harassment/threatening']) {
      add(CAT.AMENAZAS_VIOLENCIA);
    }
    if (c['harassment']) add(CAT.ACOSO_BULLYING);
    if (c['hate'] || c['hate/threatening']) add(CAT.ODIO_DISCRIMINACION);
    if (c['self-harm'] || c['self-harm/intent'] || c['self-harm/instructions']) {
      add(CAT.AUTOLESION_SUICIDIO);
    }
    if (c['illicit'] || c['illicit/violent']) add(CAT.ACTIVIDADES_ILEGALES);

    const scoreMaxGrave = Math.max(
      s['sexual/minors'] ?? 0,
      s['sexual'] ?? 0,
      s['violence'] ?? 0,
      s['hate'] ?? 0,
      s['self-harm'] ?? 0,
    );
    // Zona gris en categorías graves sin flag → marca duda.
    const dudaGrave = out.length === 0 && scoreMaxGrave >= 0.3;
    return { categorias: out, dudaGrave, scoreMaxGrave };
  }

  // ── Categorías extra por significado (Groq LLM, best-effort) ──
  private async clasificarExtrasGroq(
    texto: string,
  ): Promise<CategoriaModeracion[]> {
    const sistema =
      'Eres un moderador de una app de notas de voz. Analiza el SIGNIFICADO e ' +
      'INTENCIÓN del mensaje (no listas de palabras) y responde SOLO con un JSON ' +
      '{"categorias": [...]}. Categorías posibles: "spam_estafa" (publicidad, ' +
      'captación a otras plataformas, fraude), "datos_personales" (teléfonos, ' +
      'direcciones, redes sociales o datos que identifiquen a alguien), ' +
      '"suplantacion" (hacerse pasar por otra persona). Si no aplica ninguna, ' +
      'devuelve {"categorias": []}.';

    const res = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_LLM_MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sistema },
          { role: 'user', content: texto },
        ],
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: { categorias?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      return [];
    }
    const permitidas: CategoriaModeracion[] = [
      CAT.SPAM_ESTAFA,
      CAT.DATOS_PERSONALES,
      CAT.SUPLANTACION,
    ];
    const arr = Array.isArray(parsed.categorias) ? parsed.categorias : [];
    return arr.filter((x): x is CategoriaModeracion =>
      permitidas.includes(x as CategoriaModeracion),
    );
  }
}
