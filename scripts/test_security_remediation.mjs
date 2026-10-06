import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null, ws: false } });

// Prueba contratos de las rutas sin leer secretos ni escribir en Supabase.
process.env.SUPABASE_URL = 'https://security-test.invalid';
process.env.SUPABASE_ANON_KEY = 'test-anon';
process.env.SUPABASE_SECRET_KEY = 'test-service';
const calls = [];
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  assert.equal(url.hostname, 'security-test.invalid');
  const headers = new Headers(options.headers);
  calls.push({ url, headers, body: options.body });
  if (url.pathname === '/auth/v1/user') {
    return Response.json({ id: 'admin-test', email: 'contacto@bandabruna.cl' });
  }
  assert.equal(headers.get('apikey'), 'test-service');
  if (url.pathname.endsWith('/now_playing')) {
    return Response.json([{ radio_id: 'radio-test', artist: 'Banda Bruna', title: 'Agonía', updated_at: new Date().toISOString(), radios: { nombre: 'Radio prueba', stream_url: 'https://radio.test/stream' } }]);
  }
  if (url.pathname.endsWith('/radio_tracks')) {
    return Response.json([{ id: 'track-test', artist: 'Banda Bruna', title: 'Agonía', detected_at: new Date().toISOString(), metadata_raw: { private: true }, radios: { nombre: 'Radio prueba' } }]);
  }
  if (options.method === 'POST') return new Response(null, { status: 201 });
  return Response.json([]);
};

async function loadRoute(path) {
  return server.ssrLoadModule(`/${path}`);
}

function context(path, body, extraHeaders = {}) {
  return { request: new Request(`https://web.test${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', origin: 'https://web.test', ...extraHeaders },
    ...(body ? { body: JSON.stringify(body) } : {})
  }) };
}

// Los scripts inline llegan al navegador sin transformación de TypeScript.
const source = await readFile('src/pages/[slug].astro', 'utf8');
for (const match of source.matchAll(/<script\b[^>]*\bis:inline[^>]*>([\s\S]*?)<\/script>/g)) {
  new Function(match[1]);
}
console.log('OK: scripts inline válidos como JavaScript.');

for (const name of ['health', 'stats', 'radios']) {
  const route = await loadRoute(`src/pages/api/radio/${name}.ts`);
  const before = calls.length;
  const response = await route.GET(context(`/api/radio/${name}`));
  assert.equal(response.status, 401);
  assert.equal(calls.length, before, 'Sin token no se consulta la base');
}
console.log('OK: APIs administrativas devuelven 401 sin token.');

const nowRoute = await loadRoute('src/pages/api/radio/now.ts');
const live = await nowRoute.GET(context('/api/radio/now'));
assert.equal(live.status, 200);
assert.equal((await live.json()).nowPlaying[0].title, 'Agonía');
const historyRoute = await loadRoute('src/pages/api/radio/history.ts');
const history = await historyRoute.GET(context('/api/radio/history?limit=25'));
assert.equal(history.status, 200);
assert.equal((await history.json()).history[0].metadata_raw, undefined);
console.log('OK: radio pública devuelve detecciones e historial con cliente de servidor.');

const radiosRoute = await loadRoute('src/pages/api/radio/radios.ts');
const radios = await radiosRoute.GET(context('/api/radio/radios', null, { authorization: 'Bearer test-admin' }));
assert.equal(radios.status, 200);
assert.match(radios.headers.get('cache-control'), /private/);
console.log('OK: catálogo funciona para administrador sin caché pública.');

const quoteRoute = await loadRoute('src/pages/api/quote.js');
assert.equal((await quoteRoute.POST(context('/api/quote', {}))).status, 400);
const quote = await quoteRoute.POST(context('/api/quote', { nombre: 'Nombre prueba', telefono: '+56912345678', email: 'test@example.test', fecha_evento: '2026-12-10', ciudad: 'Temuco', tipo_evento: 'Show' }));
assert.equal(quote.status, 201);
assert.equal((await quoteRoute.POST(context('/api/quote', {}, { origin: 'https://external.test' }))).status, 403);

const commentsRoute = await loadRoute('src/pages/api/launch-comments.js');
const comment = await commentsRoute.POST(context('/api/launch-comments', { nombre: 'Nombre prueba', comentario: 'Opinión de prueba', calificacion: 5, lanzamiento_slug: 'ahogado-en-un-bar', aprobado: true }));
assert.equal(comment.status, 201);
const inserted = calls.findLast(call => call.url.pathname.endsWith('/comentarios_lanzamientos') && call.body);
assert.equal(JSON.parse(inserted.body).aprobado, false);
const comments = await commentsRoute.GET(context('/api/launch-comments?slug=ahogado-en-un-bar'));
assert.equal(comments.status, 200);
assert.equal(calls.at(-1).url.searchParams.get('aprobado'), 'eq.true');
console.log('OK: formularios válidos guardan; datos inválidos/origen externo se rechazan; opiniones quedan pendientes.');
await server.close();
