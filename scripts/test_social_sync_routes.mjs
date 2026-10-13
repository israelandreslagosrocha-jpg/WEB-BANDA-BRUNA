import assert from 'node:assert/strict';
import { createServer } from 'vite';
process.env.SUPABASE_URL = 'https://sync-test.invalid';
process.env.SUPABASE_ANON_KEY = 'test-anon';
process.env.SUPABASE_SECRET_KEY = 'test-service';
process.env.CRON_SECRET = 'test-cron';
let writes = [], failWrites = false;
const verifiedAt = '2026-10-01T12:00:00.000Z';
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  assert.equal(url.hostname, 'sync-test.invalid', 'La recepción no debe consultar redes ni contactar producción');
  if (url.pathname === '/auth/v1/user') return Response.json({ id: 'test', email: 'contacto@bandabruna.cl' });
  const method = options.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    writes.push({ table: url.pathname.split('/').pop(), body: JSON.parse(options.body) });
    return failWrites ? Response.json({ message: 'Fallo simulado', code: 'TEST' }, { status: 500 }) : new Response(null, { status: 204 });
  }
  if (method === 'HEAD') return new Response(null, { headers: { 'content-range': '0-1/1' } });
  if (url.pathname.endsWith('/configuracion')) return Response.json([{ id: 1, cant_youtube: 970, cant_instagram: 3499, cant_tiktok: 1154, cant_facebook: 4971 }]);
  if (url.pathname.endsWith('/lanzamientos')) {
    const launch = { id: 'launch', slug: 'ahogado-en-un-bar', nombre: 'Ahogado', plataformas_links: { youtube_views: 27000, youtube_likes: 250, youtube_metrics_updated_at: verifiedAt, youtube_likes_updated_at: verifiedAt } };
    return Response.json(new Headers(options.headers).get('accept')?.includes('vnd.pgrst.object') ? launch : [launch]);
  }
  return Response.json([]);
};
const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null, ws: false } });
const snapshot = () => ({ version: 1, createdAt: new Date().toISOString(), followers: {
  youtube: { value: 980, httpStatus: 200, error: null }, instagram: { value: null, httpStatus: 429, error: 'HTTP 429' },
  tiktok: { value: 1200, httpStatus: 200, error: null }, facebook: { value: null, httpStatus: 200, error: 'Cifra no encontrada' }
}, videos: { mZhYl60ENAs: { views: 26961, likes: null, httpStatus: 200, error: null } }, rss: { xml: '', httpStatus: 404, error: 'HTTP 404' } });
const ctx = (body, token = 'test-cron', route = '/api/cron/sync-social') => ({ request: new Request(`https://web-test.invalid${route}`, {
  method: body ? 'POST' : 'GET', headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {})
}) });
try {
  const sync = await server.ssrLoadModule('/src/pages/api/cron/sync-social.js');
  assert.equal((await sync.POST(ctx(snapshot(), ''))).status, 401);
  assert.equal((await sync.POST(ctx(snapshot(), 'test-admin'))).status, 403);
  assert.equal((await sync.POST(ctx({ ...snapshot(), createdAt: '2000-01-01' }))).status, 400);
  assert.equal(writes.length, 0);
  const response = await sync.POST(ctx(snapshot()));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.partial, true);
  assert.equal(body.platforms.instagram.httpStatus, 429);
  const config = writes.find(w => w.table === 'configuracion').body;
  assert.equal(config.cant_instagram, undefined, 'Una fuente fallida no debe sobrescribir el dato previo');
  const launch = writes.find(w => w.table === 'lanzamientos').body.plataformas_links;
  assert.equal(launch.youtube_views, 26961, 'Una lectura real puede bajar respecto de un número manual anterior');
  assert.equal(launch.youtube_likes, 250);
  assert.equal(launch.youtube_likes_updated_at, verifiedAt, 'Likes preservados no deben aparentar una nueva verificación');
  assert.equal(launch.youtube_metrics_status, 'partial');
  assert.ok(body.warnings.some(w => w.includes('RSS')));
  const manifest = await server.ssrLoadModule('/src/pages/api/cron/social-manifest.js');
  const before = writes.length;
  assert.equal((await manifest.GET(ctx(null, '', '/api/cron/social-manifest'))).status, 401);
  const result = await manifest.GET(ctx(null, 'test-cron', '/api/cron/social-manifest'));
  assert.deepEqual((await result.json()).videos, ['mZhYl60ENAs']);
  assert.equal(writes.length, before);
  const metrics = await server.ssrLoadModule('/src/pages/api/update-youtube-stats.js');
  const stored = await metrics.GET(ctx(null, '', '/api/update-youtube-stats?slug=ahogado-en-un-bar'));
  assert.equal((await stored.json()).updated_at, verifiedAt);
  failWrites = true;
  assert.equal((await sync.POST(ctx(snapshot()))).status, 500);
  console.log('OK: recepción protegida sin scraping en Vercel, preservación de fallos, fechas reales y errores de escritura visibles.');
} finally { await server.close(); }
