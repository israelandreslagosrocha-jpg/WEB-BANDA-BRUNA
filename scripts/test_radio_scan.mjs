import assert from 'node:assert/strict';
import { createServer } from 'vite';

process.env.SUPABASE_URL = 'https://scan-test.invalid';
process.env.SUPABASE_ANON_KEY = 'test-anon';
process.env.SUPABASE_SECRET_KEY = 'test-service';
const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null, ws: false } });
const originalTimeout = globalThis.setTimeout;
// Solo acortar la espera de confirmación de la aplicación en esta prueba aislada.
globalThis.setTimeout = (callback, delay, ...args) => originalTimeout(callback, delay === 12000 ? 0 : delay, ...args);
let writes = [], readings = 0, failWrite = false, changedPlayback = false;
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  if (url.hostname === 'radio-test.invalid') {
    readings++;
    const changed = changedPlayback && readings % 2 === 0;
    return Response.json({ icestats: { source: { listenurl: 'https://radio-test.invalid/stream', artist: changed ? 'Otro artista' : 'Banda Bruna', title: changed ? 'Otro tema' : 'Agonía' } } });
  }
  assert.equal(url.hostname, 'scan-test.invalid', 'Nunca contactar producción');
  if (url.pathname === '/auth/v1/user') return Response.json({ id: 'test', email: 'contacto@bandabruna.cl' });
  assert.equal(new Headers(options.headers).get('apikey'), 'test-service');
  if (options.method && options.method !== 'GET') {
    writes.push({ table: url.pathname.split('/').pop(), body: JSON.parse(options.body) });
    return failWrite ? Response.json({ message: 'Simulación de fallo', code: 'TEST' }, { status: 500 }) : new Response(null, { status: 204 });
  }
  if (url.pathname.endsWith('/radios')) {
    if (url.searchParams.has('limit')) return Response.json([]);
    return Response.json([{ id: 'radio1', nombre: 'Radio prueba', stream_url: 'https://radio-test.invalid/stream', radio_providers: { nombre: 'Icecast' } }]);
  }
  if (url.pathname.endsWith('/monitored_artists')) return Response.json([{ nombre: 'Banda Bruna', aliases: [] }]);
  if (url.pathname.endsWith('/monitored_tracks')) return Response.json([{ titulo: 'Agonía', aliases: [] }]);
  return Response.json([]);
};
try {
  const route = await server.ssrLoadModule('/src/pages/api/radio/scan.js');
  const ctx = authorized => ({ request: new Request('https://web-test.invalid/api/radio/scan', { headers: authorized ? { authorization: 'Bearer test-admin' } : {} }) });
  assert.equal((await route.GET(ctx(false))).status, 401);
  const response = await route.GET(ctx(true));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.summary.LIVE_CONFIRMED, 1);
  assert.equal(readings, 2);
  assert.equal(writes.find(w => w.table === 'radio_tracks').body.metadata_raw.source, 'metadata_confirmed');
  assert.ok(writes.some(w => w.table === 'now_playing'));
  changedPlayback = true;
  readings = 0;
  writes = [];
  const unconfirmed = await route.GET(ctx(true));
  assert.equal((await unconfirmed.json()).summary.UNCONFIRMED_DETECTION, 1);
  assert.equal(writes.some(w => w.table === 'radio_tracks'), false, 'No inventar historial con una detección que cambió');
  changedPlayback = false;
  failWrite = true;
  const failure = await route.GET(ctx(true));
  assert.equal(failure.status, 500);
  assert.equal((await failure.json()).summary.DATABASE_ERROR, 1);
  console.log('OK: scan protegido, dos lecturas independientes, historial confirmado y fallo de escritura visible.');
} finally {
  globalThis.setTimeout = originalTimeout;
  await server.close();
}
