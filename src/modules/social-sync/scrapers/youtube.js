import { createMetricsTracker, hasDataChanged, parseCount } from '../types.js';
import {
  getServiceClient,
  getExistingPostsMap,
  persistScrapedPost,
  updateSocialAccount,
  logScrapeRun
} from '../db.js';

const YT_CHANNEL_URL = 'https://www.youtube.com/@bandabrunaoficial';
const YT_RSS_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCYLlOjW9yD5BYFnYuoTM5kg';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

/**
 * Desescapa entidades XML/HTML comunes.
 */
function unescapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Extrae suscriptores de la cabecera pública del canal de YouTube.
 */
export async function scrapeYouTubeSubscribers() {
  try {
    const res = await fetch(YT_CHANNEL_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      console.warn(`[youtube-scraper] HTTP ${res.status} al consultar canal de YouTube.`);
      return null;
    }

    const html = await res.text();

    // 0. Intento con Schema.org / InteractionCounter (formato de microdatos oficial)
    const schemaMatch = html.match(/"@type":"InteractionCounter","interactionType":\{"@type":"FollowAction"\},"userInteractionCount":"(\d+)"/);
    if (schemaMatch && parseInt(schemaMatch[1], 10) > 0) {
      return parseInt(schemaMatch[1], 10);
    }

    // 1. Intento con pageHeaderViewModel (soporta español o inglés)
    const headerMatch = html.match(/"contentMetadataViewModel":\{"metadataRows":\[[\s\S]+?\{"text":\{"content":"([^"]+(?:suscriptor|subscriber)[^"]*)"/i);
    if (headerMatch) {
      return parseCount(headerMatch[1]);
    }

    // 2. Intento tradicional subscriberCountText
    const subMatch = html.match(/"subscriberCountText":\{.*?"(?:simpleText|label)":"([^"]+)"/i);
    if (subMatch) {
      return parseCount(subMatch[1]);
    }

    return null;
  } catch (err) {
    console.warn(`[youtube-scraper] Error al obtener suscriptores:`, err.message);
    return null;
  }
}

/**
 * Parsea el XML del feed RSS de YouTube de manera tolerante.
 * Trata las métricas como condicionales (views, likes) -> null si no existen.
 */
export function parseYouTubeRssFeed(xmlText) {
  const posts = [];
  const entryMatches = xmlText.matchAll(/<entry>([\s\S]+?)<\/entry>/g);

  for (const match of entryMatches) {
    const entry = match[1];

    // ID del video
    const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    if (!idMatch) continue;
    const videoId = idMatch[1].trim();

    // Enlace
    const linkMatch = entry.match(/<link[^>]+href="([^"]+)"/);
    const linkUrl = linkMatch ? linkMatch[1].trim() : `https://www.youtube.com/watch?v=${videoId}`;
    const isShort = linkUrl.includes('/shorts/');

    // Título
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? unescapeXml(titleMatch[1]) : null;

    // Descripción / Caption
    const descMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);
    const caption = descMatch ? unescapeXml(descMatch[1]) : null;

    // Fecha de publicación
    const pubMatch = entry.match(/<published>([^<]+)<\/published>/);
    const published_at = pubMatch ? new Date(pubMatch[1].trim()).toISOString() : null;

    // Miniatura
    const thumbMatch = entry.match(/<media:thumbnail[^>]+url="([^"]+)"/);
    const thumbnail_url = thumbMatch ? thumbMatch[1].trim() : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    // Métricas condicionales: NUNCA se asumen presentes
    // Vistas (media:statistics)
    const viewsMatch = entry.match(/<media:statistics[^>]+views="(\d+)"/);
    const views = viewsMatch ? parseInt(viewsMatch[1], 10) : null;

    // Likes (media:starRating count)
    const likesMatch = entry.match(/<media:starRating[^>]+count="(\d+)"/);
    const likes = likesMatch ? parseInt(likesMatch[1], 10) : null;

    posts.push({
      platform: 'youtube',
      external_id: videoId,
      url: linkUrl,
      post_type: isShort ? 'short' : 'video',
      title,
      caption,
      thumbnail_url,
      thumbnail_is_ephemeral: false,
      published_at,
      likes,
      views,
      comments: null // No provisto por el feed RSS
    });
  }

  return posts;
}

/**
 * Ejecutor principal del scraper de YouTube con persistencia idempotente y métricas.
 *
 * @param {Object} options
 * @param {Object} [options.client] - Cliente Supabase opcional
 * @param {boolean} [options.persist=true] - Si true, escribe en Supabase; si false, solo extrae
 * @returns {Promise<Object>} Resultado con posts, suscriptores y métricas detalladas
 */
export async function runYouTubeScraper(options = {}) {
  const startedAt = new Date();
  const metrics = createMetricsTracker();
  let client = null;
  let existingPostsMap = new Map();

  if (options.persist !== false) {
    try {
      client = getServiceClient(options.client);
      existingPostsMap = await getExistingPostsMap(client, 'youtube');
    } catch (err) {
      console.warn('[youtube-scraper] No se pudo conectar con Supabase para persistencia:', err.message);
    }
  }

  // 1. Suscriptores del canal
  const followersCount = await scrapeYouTubeSubscribers();
  if (followersCount === null) {
    metrics.errors_transient++;
  }

  // 2. Feed de descubrimiento reciente
  let scrapedPosts = [];
  try {
    const rssRes = await fetch(YT_RSS_URL, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000)
    });

    if (!rssRes.ok) {
      metrics.errors_transient++;
      console.warn(`[youtube-scraper] RSS retornó HTTP ${rssRes.status}`);
    } else {
      const xmlText = await rssRes.text();
      scrapedPosts = parseYouTubeRssFeed(xmlText);
    }
  } catch (err) {
    metrics.errors_transient++;
    console.warn(`[youtube-scraper] Error consultando RSS de YouTube:`, err.message);
  }

  metrics.items_detected = scrapedPosts.length;

  // 3. Comparación y persistencia
  for (const post of scrapedPosts) {
    const existing = existingPostsMap.get(post.external_id);

    if (!existing) {
      metrics.items_inserted++;
      if (client) {
        try {
          await persistScrapedPost(client, post);
        } catch (err) {
          console.warn(`[youtube-scraper] Error al insertar post ${post.external_id}:`, err.message);
          metrics.errors_transient++;
        }
      }
    } else if (hasDataChanged(existing, post)) {
      metrics.items_updated++;
      if (client) {
        try {
          await persistScrapedPost(client, post);
        } catch (err) {
          console.warn(`[youtube-scraper] Error al actualizar post ${post.external_id}:`, err.message);
          metrics.errors_transient++;
        }
      }
    } else {
      metrics.items_unchanged++;
    }
  }

  metrics.duration_ms = Date.now() - startedAt.getTime();

  // 4. Actualizar social_accounts y registrar log
  if (client) {
    await updateSocialAccount(client, 'youtube', {
      followers_count: followersCount,
      status: metrics.errors_transient > 0 && metrics.items_detected === 0 ? 'error' : 'ok',
      error_message: metrics.errors_transient > 0 ? `${metrics.errors_transient} errores transitorios` : null
    });

    await logScrapeRun(client, {
      run_type: 'feed_discovery',
      platform: 'youtube',
      started_at: startedAt,
      status: metrics.errors_transient > 0 && metrics.items_detected === 0 ? 'warning' : 'success',
      items_detected: metrics.items_detected,
      items_updated: metrics.items_updated + metrics.items_inserted,
      error_type: metrics.errors_transient > 0 ? 'network_error' : 'none'
    });
  }

  return {
    platform: 'youtube',
    followersCount,
    followersLabel: 'suscriptores',
    posts: scrapedPosts,
    metrics
  };
}
