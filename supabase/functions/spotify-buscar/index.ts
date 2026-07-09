// Edge Function: spotify-buscar
// Busca canciones en Spotify (flujo Client Credentials, server-side). El
// CLIENT_SECRET nunca sale del servidor. Devuelve una lista slim de temas.
//
// Secretos: SPOTIFY_CLIENT_SECRET (obligatorio). El CLIENT_ID es público.

const SPOTIFY_CLIENT_ID = '6110f99bb823451d935bc61724caba54';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SEARCH_URL = 'https://api.spotify.com/v1/search';

// CORS restringido a los orígenes web propios (nativo no manda Origin).
const ALLOWED_ORIGINS = [
  'https://riiichiperezz-design.github.io',
  'http://localhost:8081', // desarrollo (expo start)
];

const CORS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
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

function withCors(req: Request, res: Response): Response {
  const origin = req.headers.get('origin') ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
  }
  res.headers.set('Vary', 'Origin');
  return res;
}

// Límite de frecuencia sencillo por llamador (memoria del worker): sube el
// listón frente a scripts que quieran quemar la cuota de la API.
const RATE_LIMIT = 20; // peticiones/min
const hits = new Map<string, { count: number; since: number }>();

function throttled(req: Request): boolean {
  const key = req.headers.get('authorization') ?? 'anon';
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.since > 60_000) {
    hits.set(key, { count: 1, since: now });
    return false;
  }
  h.count += 1;
  return h.count > RATE_LIMIT;
}

// Cache del token de app en memoria del worker (se renueva al caducar).
let cachedToken = '';
let tokenExp = 0;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExp - 30_000) return cachedToken;

  const secret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  if (!secret) throw new Error('falta_SPOTIFY_CLIENT_SECRET');

  const basic = btoa(`${SPOTIFY_CLIENT_ID}:${secret}`);
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`token_fallo:${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExp = now + (data.expires_in ?? 3600) * 1000;
  return cachedToken;
}

type Track = {
  id: string;
  title: string;
  artist: string;
  url: string;
  image: string | null;
  preview: string | null;
};

Deno.serve(async (req: Request) => withCors(req, await handler(req)));

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'metodo_no_permitido' }, 405);
  if (throttled(req)) return json({ error: 'demasiadas_peticiones', tracks: [] }, 429);

  const body = await req.json().catch(() => null);
  const q: unknown = body?.q;
  if (typeof q !== 'string' || q.trim().length === 0) {
    return json({ tracks: [] }, 200);
  }

  let token: string;
  try {
    token = await getToken();
  } catch (e) {
    return json({ error: 'auth_spotify', detalle: String(e) }, 200);
  }

  const url = `${SEARCH_URL}?q=${encodeURIComponent(q.trim())}&type=track&limit=8`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return json({ error: `busqueda_fallo:${res.status}`, tracks: [] }, 200);

  const data = await res.json();
  const items = data?.tracks?.items ?? [];
  const tracks: Track[] = items.map((t: Record<string, unknown>) => {
    const album = (t.album ?? {}) as Record<string, unknown>;
    const images = (album.images ?? []) as { url: string }[];
    const artists = (t.artists ?? []) as { name: string }[];
    const ext = (t.external_urls ?? {}) as { spotify?: string };
    return {
      id: String(t.id ?? ''),
      title: String(t.name ?? ''),
      artist: artists.map((a) => a.name).join(', '),
      url: ext.spotify ?? '',
      image: images.length ? images[images.length - 1].url : null,
      preview: (t.preview_url as string | null) ?? null,
    };
  });

  return json({ tracks }, 200);
}
