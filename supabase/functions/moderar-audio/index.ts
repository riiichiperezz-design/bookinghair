// Edge Function: moderar-audio
// Recibe el id de un audio recién subido, ejecuta el ModeradorContenido
// configurado y actualiza su estado. Usa el ROL DE SERVICIO (server-side).
// Regla de oro: ante cualquier error, el audio se queda 'pendiente'
// (nunca se aprueba por defecto).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { moderador } from './config.ts';
import { POLITICA_MODERACION } from './categorias.ts';

// Cabeceras CORS: la app web (GitHub Pages) invoca esta función desde el
// navegador, que primero manda un preflight OPTIONS.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'metodo_no_permitido' }, 405);

  // Validación de entrada. Acepta tanto la invocación directa de la app
  // ({ audioId }) como el payload de un Database Webhook de Supabase
  // ({ type, table, record: { id, ... } }).
  const body = await req.json().catch(() => null);
  const audioId: unknown = body?.audioId ?? body?.audio_id ?? body?.record?.id;
  if (typeof audioId !== 'string' || audioId.length === 0) {
    return json({ error: 'audioId_requerido' }, 400);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'config_servidor' }, 500);

  const supa = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Carga el audio
  const { data: voz, error: vozErr } = await supa
    .from('voices')
    .select('id, audio_path, estado_moderacion')
    .eq('id', audioId)
    .maybeSingle();
  if (vozErr || !voz) return json({ error: 'audio_no_encontrado' }, 404);

  // Idempotencia: si la voz ya tiene una decisión (aprobado/rechazado/
  // revision_humana), no la re-moderamos. Esto hace seguro reintentar la
  // invocación (cliente o webhook) sin duplicar trabajo ni evidencia.
  if (voz.estado_moderacion && voz.estado_moderacion !== 'pendiente') {
    return json({ ok: true, estado: voz.estado_moderacion, skipped: true }, 200);
  }

  // URL firmada temporal para que el moderador acceda al audio.
  const { data: signed } = await supa.storage
    .from('voices')
    .createSignedUrl(voz.audio_path, 600);
  const audioUrl = signed?.signedUrl ?? '';

  // Ejecuta la moderación. Si falla → se queda 'pendiente'.
  let resultado;
  try {
    resultado = await moderador.moderar({ audioUrl });
  } catch (e) {
    // Nunca se aprueba a ciegas: la voz se queda 'pendiente'. Registramos el
    // motivo del fallo (en logs y en la BD) para poder diagnosticar.
    const motivo = e instanceof Error ? e.message : String(e);
    console.error('moderacion_fallo', motivo);
    await supa
      .from('voices')
      .update({
        motivo_moderacion: `error:${motivo}`,
        moderado_en: new Date().toISOString(),
      })
      .eq('id', audioId);
    return json(
      { ok: false, estado: 'pendiente', error: 'moderacion_fallo', motivo },
      200,
    );
  }

  const estado = resultado.decision; // aprobado | rechazado | revision_humana
  const { error: updErr } = await supa
    .from('voices')
    .update({
      estado_moderacion: estado,
      transcripcion: resultado.transcripcion ?? null,
      motivo_moderacion: resultado.categoria ?? null,
      moderado_en: new Date().toISOString(),
    })
    .eq('id', audioId);
  if (updErr) return json({ ok: false, estado: 'pendiente', error: 'update_fallo' }, 200);

  // Si necesita revisión humana, a la cola.
  if (estado === 'revision_humana') {
    await supa
      .from('cola_moderacion')
      .insert({ audio_id: audioId, motivo: resultado.categoria ?? 'sin_clasificar' });
  }

  // Conservar evidencia cuando la categoría lo exige (p. ej. CSAM) — legal.
  const cat = resultado.categoria;
  const pol = cat
    ? (POLITICA_MODERACION as Record<string, { conservarEvidencia?: boolean }>)[cat]
    : undefined;
  if (pol?.conservarEvidencia) {
    await supa.from('moderacion_evidencia').insert({
      audio_id: audioId,
      categoria: cat,
      transcripcion: resultado.transcripcion ?? null,
      audio_path: voz.audio_path,
    });
  }

  return json({ ok: true, estado }, 200);
});
