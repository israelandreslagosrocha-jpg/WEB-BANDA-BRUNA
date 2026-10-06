import assert from 'node:assert/strict';
import { createMetadataReader } from '../src/modules/radio-monitor/services/metadataReader.js';

const radio = (url, provider = 'Otro', extra = {}) => ({ stream_url: url, radio_providers: { nombre: provider }, ...extra });
const response = body => new Response(typeof body === 'string' ? body : JSON.stringify(body));
let calls = [];
let payload = {};
const reader = createMetadataReader({ fetchImpl: async url => { calls.push(url); return response(payload); } });
payload = { icestats: { source: [
  { listenurl: 'https://test.invalid/other', title: 'Banda Bruna - Agonía' },
  { listenurl: 'https://test.invalid/wanted', title: 'Otro artista - Otro tema' }
] } };
assert.equal((await reader.get(radio('https://test.invalid/wanted'))).artist, 'Otro artista');
assert.equal((await reader.get(radio('https://test.invalid/missing'))).status, 'SOURCE_MISMATCH');
assert.equal(calls.length, 1, 'Dos montajes deben compartir la lectura del servidor');
await reader.get(radio('https://test.invalid/wanted'), true);
assert.equal(calls.length, 2, 'La confirmación debe consultar de nuevo');

calls = [];
const shout = createMetadataReader({ fetchImpl: async url => { calls.push(url); return response({ songtitle: 'Banda Bruna - Agonía' }); } });
assert.equal((await shout.get(radio('https://sonic.test.invalid/8150/;'))).title, 'Agonía');
assert.equal(calls[0], 'https://sonic.test.invalid/8150/stats?json=1');

const stations = [
  { station: { shortcode: 'other', mounts: [] }, is_online: true, now_playing: { song: { artist: 'Wrong', title: 'Wrong' } } },
  { station: { shortcode: 'wanted', mounts: [{ url: 'https://azuracast.test.invalid/radio/8010/stream' }] }, is_online: true, now_playing: { song: { artist: 'Banda Bruna', title: 'Agonía' } } }
];
const azura = createMetadataReader({ fetchImpl: async () => response(stations) });
assert.equal((await azura.get(radio('https://azuracast.test.invalid/listen/wanted/radio.mp3'))).artist, 'Banda Bruna');
assert.equal((await azura.get(radio('https://azuracast.test.invalid/radio/8010/stream'))).artist, 'Banda Bruna');
assert.equal((await azura.get(radio('https://azuracast.test.invalid/listen/missing/radio.mp3'))).status, 'SOURCE_MISMATCH');
stations[1].is_online = false;
assert.equal((await azura.get(radio('https://azuracast.test.invalid/listen/wanted/radio.mp3'), true)).status, 'SOURCE_OFFLINE');

const html = createMetadataReader({ fetchImpl: async () => response('<html><title>Banda Bruna - Agonía</title></html>') });
assert.equal((await html.get(radio('https://test.invalid/ABC_SC', 'StreamTheWorld'))).online, false);
const audio = createMetadataReader({ fetchImpl: async () => new Response('audio', { headers: { 'content-type': 'audio/mpeg' } }) });
assert.equal((await audio.get(radio('https://test.invalid/stream'))).status, 'QUERY_ERROR');
const noSong = createMetadataReader({ fetchImpl: async () => response({ songtitle: 'RADIO PICARONA' }) });
const stationOnly = await noSong.get(radio('https://sonic.test.invalid/stream'));
assert.equal(stationOnly.online, false);
assert.equal(stationOnly.status, 'NO_SONG_METADATA');
const unsupported = createMetadataReader({ fetchImpl: async () => { throw new Error('No debería llamar'); } });
assert.equal((await unsupported.get(radio('https://stream.zeno.fm/stream'))).status, 'UNSUPPORTED_SOURCE');

let active = 0, peak = 0;
const bounded = createMetadataReader({ concurrency: 3, fetchImpl: async () => {
  peak = Math.max(peak, ++active);
  await new Promise(resolve => setTimeout(resolve, 5));
  active--;
  return response({ icestats: { source: { artist: 'Banda Bruna', title: 'Agonía' } } });
} });
await Promise.all(Array.from({ length: 20 }, (_, i) => bounded.get(radio(`https://test${i}.invalid/stream`))));
assert.equal(peak, 3);
const expired = createMetadataReader({ budgetMs: 0, fetchImpl: async () => { throw new Error('No debería llamar'); } });
assert.equal((await expired.get(radio('https://test.invalid/stream'))).status, 'SCAN_TIME_LIMIT');
assert.equal(expired.requestCount, 0);
console.log('OK: montaje exacto, caché por ejecución, confirmación fresca, proxy Shoutcast, estación Azura, rechazo HTML/audio, estados y concurrencia.');
