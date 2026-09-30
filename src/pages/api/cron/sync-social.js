import { parseYouTubeRssFeed, scrapeYouTubeSubscribers } from '../../../modules/social-sync/scrapers/youtube.js';
import { scrapeInstagramFollowers } from '../../../modules/social-sync/scrapers/instagram.js';
import { getVideoPlaylists } from '../../../services/socialApi.js';
import { parseCount } from '../../../modules/social-sync/types.js';
import { logScrapeRun, updateSocialAccount } from '../../../modules/social-sync/db.js';
import {
  authenticateAdminRequest,
  createServiceSupabaseClient,
  isValidCronRequest,
  jsonResponse
} from '../../../services/serverAuth.js';

export const prerender = false;
export const maxDuration = 60;

// 2. Validación de autorización (Vercel Cron O Usuario Administrador de Supabase O GitHub Actions)
async function authenticateRequest(request) {
  if (isValidCronRequest(request)) {
    return { authorized: true, userEmail: 'cron@bandabruna.cl', isCron: true };
  }

  const admin = await authenticateAdminRequest(request);
  return { ...admin, isCron: false };
}

// 3. Scrape en vivo de YouTube para "Ahogado en un Bar"
async function fetchYouTubeVideoStats(videoId = 'mZhYl60ENAs') {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let views = null;
  let likes = null;

  try {
    const res = await fetch(youtubeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (res.ok) {
      const html = await res.text();
      const viewMatch = html.match(/"viewCount":"(\d+)"/);
      const likeMatch = html.match(/"likeCount":"(\d+)"/);

      if (viewMatch && parseInt(viewMatch[1], 10) > 0) {
        views = parseInt(viewMatch[1], 10);
      }
      if (likeMatch && parseInt(likeMatch[1], 10) > 0) {
        likes = parseInt(likeMatch[1], 10);
      }
    }
  } catch (err) {
    console.warn('[sync-social] Error al scrapear video de YouTube:', err.message);
  }

  return { views, likes };
}

// 3.1 Scrape de seguidores de TikTok. Una sola consulta diaria: no usamos cookies,
// sesiones ni servicios de terceros para evitar depender de credenciales expuestas.
async function scrapeTikTokFollowers() {
  try {
    const res = await fetch('https://www.tiktok.com/@bandabrunaoficial', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      const html = await res.text();
      const descMatch = html.match(/<meta\s+(?:name|property)="(?:description|og:description)"\s+content="([^"]+)"/i);
      if (descMatch) {
        const descriptionCount = descMatch[1].match(/([0-9.,KkMm]+)\s*(?:seguidores|followers)/i);
        if (descriptionCount) {
          const parsed = parseCount(descriptionCount[1]);
          if (parsed && parsed > 500) return parsed;
        }
      }
      const match = html.match(/"followerCount":(\d+)/) ||
                    html.match(/data-e2e="followers-count">([^<]+)<\/strong>/i) ||
                    html.match(/"fans":(\d+)/);
      if (match) {
        const parsed = parseInt(match[1].replace(/[.,]/g, ''), 10);
        if (parsed && parsed > 500) return parsed;
      }
    }
  } catch (err) {
    console.warn('[sync-social] TikTok no disponible:', err.message);
  }

  return null;
}

// 3.2 Scrape de seguidores de Facebook
async function scrapeFacebookFollowers() {
  try {
    const res = await fetch('https://www.facebook.com/bandabruna', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      const html = await res.text();
      const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      if (descMatch) {
        const match = descMatch[1].match(/([0-9.,KkMm]+)\s*(?:seguidores|personas siguen|followers)/i);
        if (match) {
          const parsed = parseCount(match[1]);
          if (parsed && parsed > 1000) return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[sync-social] Facebook directo no disponible:', err.message);
  }
  return null;
}

function buildFollowerResult({ platform, scraped, previous, minimum }) {
  const hasLiveValue = Number.isFinite(scraped) && scraped > 0;
  const preservedValue = previous || minimum;
  // Una lectura pública válida es la fuente de verdad, incluso si bajó. Solo
  // preservamos el dato previo cuando la fuente no entregó una cifra.
  const value = hasLiveValue ? scraped : preservedValue;

  return {
    platform,
    value,
    status: hasLiveValue ? 'ok' : 'error',
    source: hasLiveValue ? 'public_page' : 'preserved',
    error: hasLiveValue
      ? null
      : 'No se pudo extraer la cifra pública; se conserva el último valor verificado.'
  };
}

async function persistFollowerResult(client, startedAt, followerResult) {
  const wasSuccessful = followerResult.status === 'ok';

  const accountUpdated = await updateSocialAccount(client, followerResult.platform, {
    followers_count: wasSuccessful ? followerResult.value : null,
    status: followerResult.status,
    error_message: followerResult.error
  });
  if (!accountUpdated) {
    throw new Error(`No se pudo guardar el estado de ${followerResult.platform}.`);
  }

  const runLogged = await logScrapeRun(client, {
    run_type: 'followers',
    platform: followerResult.platform,
    started_at: startedAt,
    status: wasSuccessful ? 'success' : 'failed',
    items_detected: wasSuccessful ? 1 : 0,
    items_updated: wasSuccessful ? 1 : 0,
    error_type: wasSuccessful ? 'none' : 'network_error',
    error_details: followerResult.error
  });
  if (!runLogged) {
    throw new Error(`No se pudo registrar la auditoría de ${followerResult.platform}.`);
  }
}

// 5. Orquestador central de Sincronización
async function executeSynchronization(userEmail) {
  const startedAt = new Date();
  const sb = createServiceSupabaseClient();
  const result = {
    success: true,
    started_at: startedAt.toISOString(),
    finished_at: null,
    user_email: userEmail,
    metrics: {},
    ahogado_stats: {},
    youtube_posts_synced: 0,
    social_posts_ensured: 0,
    warnings: []
  };

  // --- PASO 1: SUSCRIPTORES Y SEGUIDORES (una consulta pública por plataforma) ---
  // Las consultas independientes van en paralelo para mantener bajo el tiempo total del cron.
  const followersStartedAt = new Date();
  const [ytSubsScraped, igFollowersScraped, ttFollowersScraped, fbFollowersScraped] = await Promise.all([
    scrapeYouTubeSubscribers(),
    scrapeInstagramFollowers(),
    scrapeTikTokFollowers(),
    scrapeFacebookFollowers()
  ]);

  // Obtener valores actuales de configuracion para no decrementar números por fallas ni pisar ajustes manuales
  const { data: currentConfig } = await sb
    .from('configuracion')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const prevConfig = currentConfig || {};
  const prevYoutube = Number(prevConfig.cant_youtube) || 0;
  const prevInstagram = Number(prevConfig.cant_instagram) || 0;
  const prevTiktok = Number(prevConfig.cant_tiktok) || 0;
  const prevFacebook = Number(prevConfig.cant_facebook) || 0;

  // Si una consulta falla no se inventa un éxito: se conserva el último valor,
  // se marca la cuenta con error y se deja evidencia en social_scrape_logs.
  const followerResults = [
    buildFollowerResult({ platform: 'youtube', scraped: ytSubsScraped, previous: prevYoutube, minimum: 952 }),
    buildFollowerResult({ platform: 'instagram', scraped: igFollowersScraped, previous: prevInstagram, minimum: 3489 }),
    buildFollowerResult({ platform: 'tiktok', scraped: ttFollowersScraped, previous: prevTiktok, minimum: 1147 }),
    buildFollowerResult({ platform: 'facebook', scraped: fbFollowersScraped, previous: prevFacebook, minimum: 4971 })
  ];

  const followerResultByPlatform = Object.fromEntries(followerResults.map(item => [item.platform, item]));
  const finalYoutube = followerResultByPlatform.youtube.value;
  const finalInstagram = followerResultByPlatform.instagram.value;
  const finalTiktok = followerResultByPlatform.tiktok.value;
  const finalFacebook = followerResultByPlatform.facebook.value;

  result.metrics = {
    youtube: finalYoutube,
    instagram: finalInstagram,
    tiktok: finalTiktok,
    facebook: finalFacebook
  };
  result.platforms = Object.fromEntries(followerResults.map(item => [item.platform, {
    status: item.status,
    source: item.source,
    error: item.error
  }]));
  result.partial = followerResults.some(item => item.status !== 'ok');
  for (const item of followerResults.filter(item => item.error)) {
    result.warnings.push(`${item.platform}: ${item.error}`);
  }

  // Actualizar tabla configuracion
  const configUpdatePayload = {
    cant_youtube: finalYoutube,
    cant_instagram: finalInstagram,
    cant_tiktok: finalTiktok,
    cant_facebook: finalFacebook
  };

  const { error: confErr } = await sb
    .from('configuracion')
    .update(configUpdatePayload)
    .eq('id', 1);

  if (confErr) {
    result.success = false;
    result.warnings.push(`Error al actualizar configuracion: ${confErr.message}`);
  }

  // Actualizar estado verificable y bitácora por plataforma.
  try {
    await Promise.all(followerResults.map(item => persistFollowerResult(sb, followersStartedAt, item)));
  } catch (err) {
    result.warnings.push(`No se pudo registrar la auditoría de redes: ${err.message}`);
  }

  // --- PASO 2: ESTADÍSTICAS EN VIVO DE TODOS LOS LANZAMIENTOS ---
  result.lanzamientos_updated = [];
  const launchMetricsStartedAt = new Date();
  let launchMetricsAttempted = 0;
  let launchMetricsFailed = 0;
  try {
    const { data: allLanzamientos } = await sb
      .from('lanzamientos')
      .select('*');

    if (allLanzamientos && allLanzamientos.length > 0) {
      for (const lan of allLanzamientos) {
        let ytId = null;
        if (lan.slug === 'ahogado-en-un-bar') {
          ytId = 'mZhYl60ENAs';
        } else if (lan.slug === 'sesion-fiestas-patrias') {
          ytId = 'yXvWp-3sNuM';
        } else {
          const rawUrl = lan.video_url || (lan.plataformas_links && lan.plataformas_links.youtube) || '';
          const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
          ytId = match ? match[1] : null;
        }

        if (ytId) {
          launchMetricsAttempted++;
          const stats = await fetchYouTubeVideoStats(ytId);
          if (lan.slug === 'ahogado-en-un-bar') {
            result.ahogado_stats = stats;
          }

          if (stats.views !== null || stats.likes !== null) {
            const currentLinks = lan.plataformas_links || {};
            const isAhogado = lan.slug === 'ahogado-en-un-bar';
            const isPatrio = lan.slug === 'sesion-fiestas-patrias';
            const minViews = isAhogado ? 26611 : (isPatrio ? 9870 : 0);
            const minLikes = isAhogado ? 244 : (isPatrio ? 132 : 0);
            const newViews = Math.max(stats.views || 0, Number(currentLinks.youtube_views) || 0, minViews);
            const newLikes = Math.max(stats.likes || 0, Number(currentLinks.youtube_likes) || 0, minLikes);

            const updatedLinks = {
              ...currentLinks,
              youtube_views: newViews,
              youtube_likes: newLikes
            };

            const { error: lanErr } = await sb
              .from('lanzamientos')
              .update({
                plataformas_links: updatedLinks,
                updated_at: new Date().toISOString()
              })
              .eq('id', lan.id);

            if (lanErr) {
              launchMetricsFailed++;
              result.warnings.push(`Error al actualizar lanzamiento ${lan.slug}: ${lanErr.message}`);
            } else {
              result.lanzamientos_updated.push({
                slug: lan.slug,
                nombre: lan.nombre,
                videoId: ytId,
                views: newViews,
                likes: newLikes
              });
            }
          } else {
            launchMetricsFailed++;
            result.warnings.push(`YouTube: no se pudieron actualizar las métricas de ${lan.slug}; se conservan las cifras diarias anteriores.`);
          }
        }
      }
    }
  } catch (err) {
    launchMetricsFailed++;
    result.warnings.push(`Error al actualizar lanzamientos: ${err.message}`);
  }

  if (launchMetricsAttempted > 0) {
    const metricsStatus = launchMetricsFailed > 0 ? 'warning' : 'success';
    result.launch_metrics = {
      status: metricsStatus,
      attempted: launchMetricsAttempted,
      updated: result.lanzamientos_updated.length,
      failed: launchMetricsFailed
    };

    try {
      const metricsLogged = await logScrapeRun(sb, {
        run_type: 'metrics_refresh',
        platform: 'youtube',
        started_at: launchMetricsStartedAt,
        status: metricsStatus,
        items_detected: launchMetricsAttempted,
        items_updated: result.lanzamientos_updated.length,
        error_type: launchMetricsFailed > 0 ? 'network_error' : 'none',
        error_details: launchMetricsFailed > 0
          ? 'Una o más métricas de lanzamientos no pudieron extraerse; se conservaron los valores previos.'
          : null
      });
      if (!metricsLogged) {
        throw new Error('No se pudo guardar el registro de YouTube.');
      }
    } catch (err) {
      result.warnings.push(`No se pudo registrar la auditoría de métricas: ${err.message}`);
    }
  }

  // --- PASO 3: ÚLTIMOS VIDEOS DE YOUTUBE VÍA RSS ---
  try {
    const rssUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCYLlOjW9yD5BYFnYuoTM5kg';
    const rssRes = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (rssRes.ok) {
      const xml = await rssRes.text();
      const ytPosts = parseYouTubeRssFeed(xml);

      if (ytPosts && ytPosts.length > 0) {
        for (let i = 0; i < ytPosts.length; i++) {
          const p = ytPosts[i];
          const postPayload = {
            platform: 'youtube',
            external_id: p.external_id,
            url: p.url,
            post_type: p.post_type || 'video',
            title: p.title,
            caption: p.caption,
            thumbnail_url: p.thumbnail_url,
            published_at: p.published_at,
            disponible: true,
            // Omitimos show_on_web y web_order: la tabla los deja ocultos al crear
            // y el upsert conserva la decisión editorial en publicaciones existentes.
            last_scraped_at: new Date().toISOString()
          };

          // Si es el video de ahogado en un bar, agregar métricas
          if (p.external_id === 'mZhYl60ENAs' && result.ahogado_stats?.views) {
            postPayload.views = result.ahogado_stats.views;
            postPayload.likes = result.ahogado_stats.likes;
          }

          const { error: upsertErr } = await sb
            .from('social_posts')
            .upsert(postPayload, { onConflict: 'platform,external_id' });

          if (!upsertErr) {
            result.youtube_posts_synced++;
          } else {
            result.warnings.push(`Error al guardar video YouTube (${p.external_id}): ${upsertErr.message}`);
          }
        }
      }
    }
  } catch (err) {
    result.warnings.push(`Error al sincronizar feed RSS de YouTube: ${err.message}`);
  }

  // --- PASO 4: CATÁLOGO DE VIDEOS Y REELS (FALLBACK PARA SECCIÓN VIDEOS) ---
  // Solo se siembran si la base de datos no tiene videos activos con web_order configurados
  try {
    const platformsToSync = ['facebook', 'instagram', 'tiktok'];

    for (const plat of platformsToSync) {
      // Verificar si ya existen publicaciones con web_order en esta plataforma
      const { count } = await sb
        .from('social_posts')
        .select('id', { count: 'exact', head: true })
        .eq('platform', plat)
        .eq('show_on_web', true)
        .not('web_order', 'is', null);

      // Si el administrador ya configuró videos con web_order, respetamos su selección
      if (count && count > 0) {
        continue;
      }

      const playlists = getVideoPlaylists();
      const items = playlists[plat] || [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const postType = plat === 'tiktok' ? 'video' : 'reel';
        const postPayload = {
          platform: plat,
          external_id: item.id,
          url: item.url,
          post_type: postType,
          title: item.title,
          caption: item.title,
          thumbnail_url: item.thumbnail,
          disponible: true,
          show_on_web: true,
          web_order: i + 1,
          last_scraped_at: new Date().toISOString()
        };

        const { error: pErr } = await sb
          .from('social_posts')
          .upsert(postPayload, { onConflict: 'platform,external_id' });

        if (!pErr) {
          result.social_posts_ensured++;
        } else {
          result.warnings.push(`Error al guardar post de ${plat} (${item.id}): ${pErr.message}`);
        }
      }
    }
  } catch (err) {
    result.warnings.push(`Error al asegurar catálogo de videos/reels: ${err.message}`);
  }

  // --- PASO 5: REGISTRO EN BITÁCORA DE AUDITORÍA ---
  try {
    const logActionText = `Sincronización completa de redes (YT: ${finalYoutube}, IG: ${finalInstagram}, TT: ${finalTiktok}, FB: ${finalFacebook}). Ahogado en un Bar vistas: ${result.ahogado_stats?.views || 'mantenidas'}`;
    await sb
      .from('logs_actividad')
      .insert([{
        usuario_email: userEmail,
        accion: logActionText,
        created_at: new Date().toISOString()
      }]);
  } catch (err) {
    // Si falla el log, no bloquea el resultado
  }

  result.finished_at = new Date().toISOString();
  return result;
}

export async function GET({ request }) {
  const auth = await authenticateRequest(request);
  if (!auth.authorized) {
    return jsonResponse({ success: false, error: 'No autorizado' }, 401);
  }

  const result = await executeSynchronization(auth.userEmail);
  return jsonResponse(result);
}

export async function POST({ request }) {
  const auth = await authenticateRequest(request);
  if (!auth.authorized) {
    return jsonResponse({ success: false, error: 'No autorizado' }, 401);
  }

  const result = await executeSynchronization(auth.userEmail);
  return jsonResponse(result);
}
