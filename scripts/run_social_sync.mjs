import { collectPublicMetrics, validateSnapshot } from '../src/modules/social-sync/publicMetrics.js';

const dryRun = process.argv.includes('--dry-run');
const token = process.env.CRON_SECRET;
if (!dryRun && process.env.GITHUB_REF && process.env.GITHUB_REF !== 'refs/heads/main') throw new Error('Guardado bloqueado fuera de main');
if (!dryRun && !token) throw new Error('Falta CRON_SECRET');
const base = 'https://www.bandabruna.cl';
const headers = { Authorization: `Bearer ${token}` };
let manifest = { success: true, videos: ['mZhYl60ENAs', 'yXvWp-3sNuM'] };
if (!dryRun) {
  const manifestResponse = await fetch(`${base}/api/cron/social-manifest`, { headers, signal: AbortSignal.timeout(15000) });
  if (!manifestResponse.ok) throw new Error(`Manifest HTTP ${manifestResponse.status}`);
  manifest = await manifestResponse.json();
}
if (manifest.success !== true || !Array.isArray(manifest.videos)) throw new Error('Manifest inválido');
const snapshot = await collectPublicMetrics(manifest.videos);
if (!validateSnapshot(snapshot)) throw new Error('Las métricas extraídas no cumplen el contrato');
for (const [platform, detail] of Object.entries(snapshot.followers)) {
  console.log(JSON.stringify({ platform, value: detail.value, httpStatus: detail.httpStatus, error: detail.error }));
}
for (const [videoId, detail] of Object.entries(snapshot.videos)) console.log(JSON.stringify({ videoId, ...detail }));
console.log(JSON.stringify({ rssHttpStatus: snapshot.rss.httpStatus, rssError: snapshot.rss.error }));
if (dryRun) {
  const complete = ['youtube', 'instagram', 'tiktok'].every(platform => snapshot.followers[platform].value !== null)
    && manifest.videos.every(id => snapshot.videos[id]?.views !== null && snapshot.videos[id]?.likes !== null);
  console.log(JSON.stringify({ dryRun: true, writes: 0, verified: complete, facebookPending: snapshot.followers.facebook.value === null }));
  if (!complete) throw new Error('La extracción desde este runner no pasó las comprobaciones requeridas');
  process.exit(0);
}
// Una sola recepción: no reintentar escrituras a ciegas si se pierde la respuesta.
const response = await fetch(`${base}/api/cron/sync-social`, {
  method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify(snapshot), signal: AbortSignal.timeout(45000)
});
if (!response.ok) throw new Error(`Recepción HTTP ${response.status}`);
const result = await response.json();
if (result.success !== true) throw new Error('No se pudo guardar la sincronización');
console.log(JSON.stringify({ metrics: result.metrics, platforms: result.platforms, launch_metrics: result.launch_metrics, warnings: result.warnings }));
if (result.partial) console.log('::warning::Sincronización parcial: revisar diagnósticos por fuente; las cifras fallidas no se reemplazaron.');
