import { createMetricsTracker, hasDataChanged, parseCount } from '../types.js';
import {
  getServiceClient,
  getExistingPostsMap,
  persistScrapedPost,
  recordPostCheckFailure,
  updateSocialAccount,
  logScrapeRun
} from '../db.js';

const IG_PROFILE_URL = 'https://www.instagram.com/banda_bruna/';

const IG_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7',
  'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

/**
 * Desescapa entidades HTML.
 */
function unescapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#xae;/gi, '®')
    .replace(/&#064;/g, '@')
    .trim();
}

/**
 * Extrae seguidores de la cabecera/metadatos de Instagram.
 */
export async function scrapeInstagramFollowers() {
  try {
    const res = await fetch(IG_PROFILE_URL, {
      headers: IG_HEADERS,
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      console.warn(`[instagram-scraper] HTTP ${res.status} al consultar perfil.`);
      return null;
    }

    const html = await res.text();

    const descMatch = html.match(/<meta\s+(?:property|name)="(?:og:description|description)"\s+content="([^"]+)"/i);
    if (descMatch) {
      const content = unescapeHtml(descMatch[1]);
      // Ej: "3,360 seguidores, 1,455 seguidos..." o "3,360 Followers, 150 Following..."
      const fMatch = content.match(/([0-9.,KkMm]+)\s*(?:seguidores|followers)/i);
      if (fMatch) {
        return parseCount(fMatch[1]);
      }
    }

    return null;
  } catch (err) {
    console.warn(`[instagram-scraper] Error al obtener seguidores:`, err.message);
    return null;
  }
}

/**
 * Parsea los metadatos de un post individual de Instagram de forma tolerante.
 * Si el post no existe o fue eliminado, retorna { is404: true }.
 */
export function parseInstagramPostHtml(html, shortcode, isReel = false) {
  const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
  const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) ||
                      html.match(/<meta name="description" content="([^"]+)"/i);
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);

  // Detección de soft-404: Si no hay og:title ni og:image y el título es genérico o dice "no disponible"
  const titleTagMatch = html.match(/<title>([^<]*)<\/title>/i);
  const titleTag = titleTagMatch ? titleTagMatch[1] : '';

  if (!ogDescMatch && !ogImageMatch && (!ogTitleMatch || titleTag === 'Instagram')) {
    return { is404: true };
  }

  let likes = null;
  let comments = null;
  let published_at = null;
  let caption = null;

  if (ogDescMatch) {
    const desc = unescapeHtml(ogDescMatch[1]);
    // Formato común: "26 likes, 0 comments - banda_bruna el June 21, 2026: \"Caption...\""
    const parsedDesc = desc.match(/^([0-9.,KkMm]+)\s+likes?,\s+([0-9.,KkMm]+)\s+comments?\s+-\s+([a-zA-Z0-9._]+)\s+(?:el|on)\s+([A-Za-z]+\s+\d{1,2},\s+\d{4}):\s*([\s\S]*)$/i);
    
    if (parsedDesc) {
      likes = parseCount(parsedDesc[1]);
      comments = parseCount(parsedDesc[2]);
      const rawDate = parsedDesc[4];
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        published_at = parsedDate.toISOString();
      }
      caption = parsedDesc[5]?.trim().replace(/^"|"$/g, '') || null;
    } else {
      // Fallback si el formato cambió: intentar extraer likes o comentarios aislados
      const lMatch = desc.match(/([0-9.,KkMm]+)\s+likes?/i);
      const cMatch = desc.match(/([0-9.,KkMm]+)\s+comments?/i);
      if (lMatch) likes = parseCount(lMatch[1]);
      if (cMatch) comments = parseCount(cMatch[1]);
    }
  }

  // Fallback de caption desde og:title si no se extrajo
  if (!caption && ogTitleMatch) {
    const titleText = unescapeHtml(ogTitleMatch[1]);
    const quoteMatch = titleText.match(/"([^"]+)"/);
    if (quoteMatch) caption = quoteMatch[1];
  }

  const rawThumb = ogImageMatch ? unescapeHtml(ogImageMatch[1]) : null;
  const thumbnail_url = rawThumb ? rawThumb.replace(/&amp;/g, '&') : null;
  const post_type = isReel ? 'reel' : 'post';
  const url = isReel ? `https://www.instagram.com/reel/${shortcode}/` : `https://www.instagram.com/p/${shortcode}/`;

  return {
    is404: false,
    post: {
      platform: 'instagram',
      external_id: shortcode,
      url,
      post_type,
      title: null,
      caption,
      thumbnail_url,
      thumbnail_is_ephemeral: true,
      published_at,
      likes,
      views: null, // Instagram no expone views públicas estáticas en HTML
      comments
    }
  };
}

/**
 * Ejecutor principal del scraper de Instagram con persistencia idempotente, métricas y regla 404 temporal.
 *
 * @param {Object} options
 * @param {Object} [options.client] - Cliente Supabase opcional
 * @param {boolean} [options.persist=true] - Si true, escribe en Supabase; si false, solo extrae
 * @param {number} [options.maxPosts=6] - Límite de posts a inspeccionar en profundidad
 * @returns {Promise<Object>} Resultado con posts, seguidores y métricas
 */
export async function runInstagramScraper(options = {}) {
  const startedAt = new Date();
  const metrics = createMetricsTracker();
  let client = null;
  let existingPostsMap = new Map();

  if (options.persist !== false) {
    try {
      client = getServiceClient(options.client);
      existingPostsMap = await getExistingPostsMap(client, 'instagram');
    } catch (err) {
      console.warn('[instagram-scraper] No se pudo conectar con Supabase para persistencia:', err.message);
    }
  }

  // 1. Seguidores del perfil
  const followersCount = await scrapeInstagramFollowers();
  if (followersCount === null) {
    metrics.errors_transient++;
  }

  // 2. Descubrimiento de shortcodes en el feed HTML
  let shortcodes = [];
  try {
    const res = await fetch(IG_PROFILE_URL, {
      headers: IG_HEADERS,
      signal: AbortSignal.timeout(10000)
    });

    if (res.status === 403 || res.status === 429) {
      metrics.errors_transient++;
    } else if (res.ok) {
      const html = await res.text();
      const pMatches = [...html.matchAll(/\/p\/([a-zA-Z0-9_-]+)\//g)].map(m => ({ id: m[1], isReel: false }));
      const rMatches = [...html.matchAll(/\/reel\/([a-zA-Z0-9_-]+)\//g)].map(m => ({ id: m[1], isReel: true }));
      
      const seen = new Set();
      for (const item of [...pMatches, ...rMatches]) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          shortcodes.push(item);
        }
      }
    }
  } catch (err) {
    metrics.errors_transient++;
    console.warn(`[instagram-scraper] Error al obtener feed de Instagram:`, err.message);
  }

  const targetItems = shortcodes.slice(0, options.maxPosts || 6);
  metrics.items_detected = targetItems.length;

  // 3. Inspección tolerante por publicación individual
  const parsedPosts = [];
  for (const item of targetItems) {
    const postUrl = item.isReel ? `https://www.instagram.com/reel/${item.id}/` : `https://www.instagram.com/p/${item.id}/`;
    try {
      const res = await fetch(postUrl, {
        headers: IG_HEADERS,
        signal: AbortSignal.timeout(8000)
      });

      if (res.status === 404) {
        metrics.items_404++;
        if (client) {
          const existing = existingPostsMap.get(item.id);
          await recordPostCheckFailure(client, existing, 'http_404');
        }
        continue;
      }

      if (res.status === 403 || res.status === 429) {
        metrics.errors_transient++;
        if (client) {
          const existing = existingPostsMap.get(item.id);
          await recordPostCheckFailure(client, existing, 'waf_challenge');
        }
        continue;
      }

      const html = await res.text();
      const parseRes = parseInstagramPostHtml(html, item.id, item.isReel);

      if (parseRes.is404) {
        metrics.items_404++;
        if (client) {
          const existing = existingPostsMap.get(item.id);
          await recordPostCheckFailure(client, existing, 'http_404');
        }
        continue;
      }

      const post = parseRes.post;
      parsedPosts.push(post);

      const existing = existingPostsMap.get(post.external_id);
      if (!existing) {
        metrics.items_inserted++;
        if (client) {
          try {
            await persistScrapedPost(client, post);
          } catch (err) {
            console.warn(`[instagram-scraper] Error al insertar post ${post.external_id}:`, err.message);
            metrics.errors_transient++;
          }
        }
      } else if (hasDataChanged(existing, post)) {
        metrics.items_updated++;
        if (client) {
          try {
            await persistScrapedPost(client, post);
          } catch (err) {
            console.warn(`[instagram-scraper] Error al actualizar post ${post.external_id}:`, err.message);
            metrics.errors_transient++;
          }
        }
      } else {
        metrics.items_unchanged++;
      }

      // Pequeña pausa de cortesía entre consultas individuales para estabilidad
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      metrics.errors_transient++;
      console.warn(`[instagram-scraper] Error consultando post ${item.id}:`, err.message);
      if (client) {
        const existing = existingPostsMap.get(item.id);
        await recordPostCheckFailure(client, existing, 'timeout');
      }
    }
  }

  metrics.duration_ms = Date.now() - startedAt.getTime();

  // 4. Actualizar social_accounts y registrar log
  if (client) {
    await updateSocialAccount(client, 'instagram', {
      followers_count: followersCount,
      status: metrics.errors_transient > 0 && metrics.items_detected === 0 ? 'error' : 'ok',
      error_message: metrics.errors_transient > 0 ? `${metrics.errors_transient} errores transitorios` : null
    });

    await logScrapeRun(client, {
      run_type: 'feed_discovery',
      platform: 'instagram',
      started_at: startedAt,
      status: metrics.errors_transient > 0 && metrics.items_detected === 0 ? 'warning' : 'success',
      items_detected: metrics.items_detected,
      items_updated: metrics.items_updated + metrics.items_inserted,
      error_type: metrics.errors_transient > 0 ? 'network_error' : 'none'
    });
  }

  return {
    platform: 'instagram',
    followersCount,
    followersLabel: 'seguidores',
    posts: parsedPosts,
    metrics
  };
}
