// Carga voces de prueba en Supabase para poder probar recibir/reaccionar.
//
// Uso (una vez):
//   1. Consigue tu SERVICE ROLE KEY en Supabase →
//      Project Settings → API → "service_role" (¡secreta, no la subas!).
//   2. Ejecuta:
//        Windows PowerShell:
//          $env:SUPABASE_SERVICE_ROLE_KEY="pega_aqui"; node scripts/seed.mjs
//        Mac/Linux:
//          SUPABASE_SERVICE_ROLE_KEY="pega_aqui" node scripts/seed.mjs
//
// Crea unos usuarios demo con perfil (@usuario + país) y sube una voz de cada
// uno al pool. Luego, en la app: manda 1 voz y pulsa "Abrir mis voces".

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

function readEnvUrl() {
  if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
    return process.env.EXPO_PUBLIC_SUPABASE_URL;
  }
  try {
    const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    const m = env.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/);
    if (m) return m[1].trim();
  } catch {}
  return null;
}

const SUPABASE_URL = readEnvUrl();
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    '❌ Falta config. Necesito EXPO_PUBLIC_SUPABASE_URL (de tu .env) y ' +
      'la variable SUPABASE_SERVICE_ROLE_KEY. Lee las instrucciones arriba.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Genera un WAV PCM 16-bit mono con un tono suave ---
function makeWav(seconds, freq) {
  const rate = 16000;
  const n = Math.floor(rate * seconds);
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    // tono con leve fade in/out para que no "chasquee"
    const fade = Math.min(1, i / 800, (n - i) / 800);
    const s = Math.sin((2 * Math.PI * freq * i) / rate) * 0.3 * fade;
    data.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const DEMO = [
  { username: 'lucia_qto', country: 'Ecuador', freq: 330, secs: 4 },
  { username: 'mateo_ba', country: 'Argentina', freq: 392, secs: 5 },
  { username: 'sofia_mx', country: 'México', freq: 440, secs: 3 },
  { username: 'dani_es', country: 'España', freq: 294, secs: 6 },
  { username: 'cami_co', country: 'Colombia', freq: 349, secs: 4 },
];

async function getOrCreateUser(email) {
  const created = await supabase.auth.admin.createUser({
    email,
    password: 'ecco-demo-' + Math.random().toString(36).slice(2),
    email_confirm: true,
  });
  if (created.data?.user) return created.data.user;

  // Si ya existe, lo buscamos.
  for (let page = 1; page <= 10; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const found = data?.users?.find((u) => u.email === email);
    if (found) return found;
    if (!data || data.users.length < 200) break;
  }
  throw new Error('No pude crear ni encontrar el usuario ' + email);
}

async function run() {
  console.log('🌱 Sembrando voces de prueba…');
  for (const d of DEMO) {
    const email = `${d.username}@ecco.demo`;
    const user = await getOrCreateUser(email);

    await supabase
      .from('profiles')
      .upsert({ id: user.id, username: d.username, country: d.country });

    const wav = makeWav(d.secs, d.freq);
    const path = `${user.id}/seed-${Date.now()}.wav`;
    const up = await supabase.storage
      .from('voices')
      .upload(path, wav, { contentType: 'audio/wav', upsert: true });
    if (up.error) throw up.error;

    const ins = await supabase.from('voices').insert({
      sender_id: user.id,
      audio_path: path,
      duration_ms: d.secs * 1000,
      country: d.country,
      // Datos demo de confianza: entran ya aprobados para poder repartirse.
      estado_moderacion: 'aprobado',
      moderado_en: new Date().toISOString(),
    });
    if (ins.error) throw ins.error;

    console.log(`  ✔ @${d.username} (${d.country}) — voz subida`);
  }
  console.log('✅ Listo. Abre la app, manda una voz y pulsa "Abrir mis voces".');
}

run().catch((e) => {
  console.error('❌ Error:', e.message ?? e);
  process.exit(1);
});
