import { parseCount } from './types.js';

export const PROFILE_URLS = Object.freeze({
  youtube: 'https://www.youtube.com/@bandabrunaoficial',
  instagram: 'https://www.instagram.com/banda_bruna/',
  tiktok: 'https://www.tiktok.com/@bandabrunaoficial',
  facebook: 'https://www.facebook.com/bandabruna'
});
export const RSS_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCYLlOjW9yD5BYFnYuoTM5kg';
const decode = text => String(text || '').replace(/&quot;|&#34;/g, '"').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/\\u0026/g, '&');
const valid = value => Number.isSafeInteger(value) && value >= 0 && value <= 100_000_000_000;

function descriptions(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].filter(m => /(?:name|property)=["'](?:og:description|description)["']/i.test(m[0]))
    .map(m => decode(m[0].match(/content=(["'])(.*?)\1/i)?.[2])).join(' ');
}

export function parseFollowers(platform, html) {
  const description = descriptions(html);
  const label = platform === 'youtube' ? '(?:suscriptores|subscribers)' : '(?:seguidores|followers|personas siguen)';
  const described = description.match(new RegExp(`([0-9.,]+(?:\\s*(?:K|M|mil|millones))?)\\s*${label}`, 'i'));
  if (described) return parseCount(described[1]);
  const patterns = {
    youtube: [/"@type":"InteractionCounter","interactionType":\{"@type":"FollowAction"\},"userInteractionCount":"(\d+)"/, /"subscriberCountText":\{.*?"(?:simpleText|label)":"([^"]+)"/i, /"content":"([^"\n]*(?:suscriptores|subscribers))"/i],
    instagram: [/"edge_followed_by":\s*\{\s*"count":\s*(\d+)/],
    tiktok: [/"followerCount":\s*(\d+)/, /data-e2e=["']followers-count["'][^>]*>([^<]+)</i],
    facebook: [/"follower_count":\s*(\d+)/, /"text":"([0-9.,]+(?:\s*(?:K|M|mil))?\s+(?:seguidores|followers))"/i]
  };
  for (const pattern of patterns[platform] || []) {
    const value = html.match(pattern)?.[1];
    if (value) return parseCount(value);
  }
  return null;
}

export function parseVideoMetrics(html, videoId) {
  // Priorizar videoDetails del video solicitado, no contadores de recomendaciones.
  const details = html.match(/"videoDetails":(\{[\s\S]*?\}),"/);
  let views = null;
  if (details) {
    try { const video = JSON.parse(details[1]); if (video.videoId === videoId) views = Number(video.viewCount); } catch {}
  }
  if (views === null && html.includes(`"videoId":"${videoId}"`)) views = Number(html.match(/"viewCount":"(\d+)"/)?.[1] ?? NaN);
  const likes = Number(html.match(/"likeCount":"(\d+)"/)?.[1] ?? html.match(/"accessibilityText":"([\d.,]+)\s+(?:likes|Me gusta)/i)?.[1]?.replace(/[.,]/g, '') ?? NaN);
  return { views: valid(views) ? views : null, likes: valid(likes) ? likes : null };
}

export function launchVideoId(launch) {
  if (launch.slug === 'ahogado-en-un-bar') return 'mZhYl60ENAs';
  if (launch.slug === 'sesion-fiestas-patrias') return 'yXvWp-3sNuM';
  const link = launch.video_url || launch.plataformas_links?.youtube || '';
  return link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)?.[1] || null;
}

export async function readPublicPage(url, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'es-419,es;q=0.9,en;q=0.8' }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) { await response.body?.cancel(); return { html: '', httpStatus: response.status, error: `HTTP ${response.status}` }; }
    const reader = response.body?.getReader();
    let bytes = 0, html = '';
    const decoder = new TextDecoder();
    if (!reader) return { html: '', httpStatus: response.status, error: 'Respuesta vacía' };
    try {
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        bytes += value.byteLength; if (bytes > 4 * 1024 * 1024) throw new Error('RESPONSE_TOO_LARGE');
        html += decoder.decode(value, { stream: true });
      }
      html += decoder.decode();
    } finally { await reader.cancel(); }
    return { html, httpStatus: response.status, error: null };
  } catch (error) {
    return { html: '', httpStatus: null, error: error.name === 'TimeoutError' ? 'Timeout de consulta' : 'Error de conexión o respuesta demasiado grande' };
  }
}

export async function collectPublicMetrics(videos = [], fetchImpl = fetch) {
  const createdAt = new Date().toISOString();
  const deadline = Date.now() + 40000;
  const read = url => Date.now() >= deadline
    ? Promise.resolve({ html: '', httpStatus: null, error: 'Presupuesto de consulta agotado' })
    : readPublicPage(url, fetchImpl);
  const followers = {};
  const videoMetrics = {};
  await Promise.all(Object.entries(PROFILE_URLS).map(async ([platform, url]) => {
    const page = await read(url);
    const value = parseFollowers(platform, page.html);
    followers[platform] = { value: valid(value) ? value : null, httpStatus: page.httpStatus, error: page.error || (valid(value) ? null : 'Cifra pública no encontrada') };
  }));
  // Cache por ID: si dos lanzamientos apuntan al mismo video solo se consulta una vez.
  for (const videoId of [...new Set(videos)].slice(0, 30)) {
    if (!/^[\w-]{11}$/.test(videoId)) continue;
    const page = await read(`https://www.youtube.com/watch?v=${videoId}`);
    const metrics = parseVideoMetrics(page.html, videoId);
    videoMetrics[videoId] = { ...metrics, httpStatus: page.httpStatus, error: page.error || (metrics.views === null && metrics.likes === null ? 'Métricas públicas no encontradas' : null) };
  }
  const feed = await read(RSS_URL);
  const feedFits = new TextEncoder().encode(feed.html).byteLength <= 64 * 1024;
  return { version: 1, createdAt, followers, videos: videoMetrics,
    rss: { xml: feedFits ? feed.html : '', httpStatus: feed.httpStatus, error: feed.error || (feedFits ? null : 'Feed supera el límite de recepción') } };
}

export function validateSnapshot(snapshot) {
  if (snapshot?.version !== 1 || !snapshot.followers || !snapshot.videos) return false;
  const age = Date.now() - Date.parse(snapshot.createdAt);
  if (!Number.isFinite(age) || age < -60_000 || age > 15 * 60_000) return false;
  const safeMetric = value => value === null || valid(value);
  const safeDetail = detail => detail && (detail.httpStatus === null || (Number.isInteger(detail.httpStatus) && detail.httpStatus >= 100 && detail.httpStatus <= 599)) && (detail.error === null || (typeof detail.error === 'string' && detail.error.length <= 200));
  return Object.keys(snapshot.followers).length === 4 && Object.keys(PROFILE_URLS).every(key => safeDetail(snapshot.followers[key]) && safeMetric(snapshot.followers[key].value))
    && Object.keys(snapshot.videos).length <= 30 && Object.entries(snapshot.videos).every(([id, data]) => /^[\w-]{11}$/.test(id) && safeDetail(data) && safeMetric(data.views) && safeMetric(data.likes))
    && safeDetail(snapshot.rss) && typeof snapshot.rss.xml === 'string' && snapshot.rss.xml.length <= 80000;
}
