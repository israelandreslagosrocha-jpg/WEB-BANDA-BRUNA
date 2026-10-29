import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// Retirar el monitor no debe iniciar consultas externas ni escrituras.
globalThis.fetch = () => { throw new Error('El monitor retirado no debe usar fetch'); };
for (const route of ['scan.js', 'health.ts', 'history.ts', 'now.ts', 'radios.ts', 'stats.ts']) {
  const { GET } = await import('../src/pages/api/radio/' + route);
  const response = await GET();
  assert.equal(response.status, 410);
  assert.equal((await response.json()).retired, true);
}
const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
assert.ok(!(vercel.crons || []).some(cron => cron.path.startsWith('/api/radio/')));
for (const path of ['../src/pages/index.astro', '../src/pages/admin/dashboard.astro']) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  assert.ok(!source.includes('NowPlayingWidget'));
  assert.ok(!source.includes('/api/radio/'));
}
console.log('OK: radios retiradas, sin consultas, escrituras, cron ni controles activos.');
