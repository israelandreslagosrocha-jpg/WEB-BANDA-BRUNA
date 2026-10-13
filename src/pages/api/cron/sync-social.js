import { parseYouTubeRssFeed } from '../../../modules/social-sync/scrapers/youtube.js';
import { collectPublicMetrics, launchVideoId, validateSnapshot } from '../../../modules/social-sync/publicMetrics.js';
import { getVideoPlaylists } from '../../../services/socialApi.js';
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

function buildFollowerResult({ platform, scraped, previous, minimum }) {
  const hasLiveValue = Number.isFinite(scraped) && scraped >= 0;
  const preservedValue = previous ?? minimum;
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
async function executeSynchronization(userEmail, snapshot = null) {
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
  const { data: launches, error: launchesError } = await sb.from('lanzamientos').select('*');
  if (launchesError) throw new Error('No se pudo leer el catálogo de lanzamientos');
  const collected = snapshot || await collectPublicMetrics((launches || []).map(launchVideoId).filter(Boolean));
  result.extraction_source = snapshot ? 'github_runner' : 'vercel_manual';
  const ytSubsScraped = collected.followers.youtube.value;
  const igFollowersScraped = collected.followers.instagram.value;
  const ttFollowersScraped = collected.followers.tiktok.value;
  const fbFollowersScraped = collected.followers.facebook.value;

  // Obtener valores actuales de configuracion para no decrementar números por fallas ni pisar ajustes manuales
  const { data: currentConfig, error: configReadError } = await sb
    .from('configuracion')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (configReadError || !currentConfig) throw new Error('No se pudo leer la configuración actual');

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
  for (const item of followerResults) {
    const detail = collected.followers[item.platform];
    item.httpStatus = detail.httpStatus;
    if (item.status !== 'ok') item.error = `${detail.error || 'Cifra no disponible'}; se conserva el valor anterior.`;
  }

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
    httpStatus: item.httpStatus,
    attempted_at: collected.createdAt,
    verified_at: item.status === 'ok' ? collected.createdAt : null,
    error: item.error
  }]));
  result.partial = followerResults.some(item => item.status !== 'ok');
  for (const item of followerResults.filter(item => item.error)) {
    result.warnings.push(`${item.platform}: ${item.error}`);
  }

  // Actualizar tabla configuracion
  const configUpdatePayload = Object.fromEntries(followerResults.filter(item => item.status === 'ok').map(item => [`cant_${item.platform}`, item.value]));
  const { error: confErr } = Object.keys(configUpdatePayload).length
    ? await sb.from('configuracion').update(configUpdatePayload).eq('id', 1)
    : { error: null };

  if (confErr) {
    result.success = false;
    result.warnings.push(`Error al actualizar configuracion: ${confErr.message}`);
  }

  // Actualizar estado verificable y bitácora por plataforma.
  try {
    await Promise.all(followerResults.map(item => persistFollowerResult(sb, followersStartedAt, item)));
  } catch (err) {
    result.success = false;
    result.warnings.push(`No se pudo registrar la auditoría de redes: ${err.message}`);
  }

  // --- PASO 2: ESTADÍSTICAS EN VIVO DE TODOS LOS LANZAMIENTOS ---
  result.lanzamientos_updated = [];
  const launchMetricsStartedAt = new Date();
  let launchMetricsAttempted = 0;
  let launchMetricsFailed = 0;
  let launchMetricsPartial = 0;
  try {
    const allLanzamientos = launches;

    if (allLanzamientos && allLanzamientos.length > 0) {
      for (const lan of allLanzamientos) {
        const ytId = launchVideoId(lan);

        if (ytId) {
          launchMetricsAttempted++;
          const stats = collected.videos[ytId] || { views: null, likes: null, error: 'Video no incluido en la consulta' };
          if (lan.slug === 'ahogado-en-un-bar') {
            result.ahogado_stats = stats;
          }

          if (stats.views !== null || stats.likes !== null) {
            if (stats.views === null || stats.likes === null) {
              launchMetricsPartial++;
              result.warnings.push(`YouTube (${lan.slug}): solo se pudo actualizar ${stats.views === null ? 'likes' : 'reproducciones'}; el otro dato conserva su fecha anterior.`);
            }
            const currentLinks = lan.plataformas_links || {};
            const newViews = stats.views ?? currentLinks.youtube_views ?? null;
            const newLikes = stats.likes ?? currentLinks.youtube_likes ?? null;

            const updatedLinks = {
              ...currentLinks,
              youtube_views: newViews,
              youtube_likes: newLikes,
              youtube_metrics_updated_at: collected.createdAt,
              youtube_views_updated_at: stats.views !== null ? collected.createdAt : currentLinks.youtube_views_updated_at || null,
              youtube_likes_updated_at: stats.likes !== null ? collected.createdAt : currentLinks.youtube_likes_updated_at || null,
              youtube_metrics_attempted_at: collected.createdAt,
              youtube_metrics_status: stats.views !== null && stats.likes !== null ? 'ok' : 'partial',
              youtube_metrics_error: stats.error || null
            };

            const { error: lanErr } = await sb
              .from('lanzamientos')
              .update({
                plataformas_links: updatedLinks,
                updated_at: new Date().toISOString()
              })
              .eq('id', lan.id);

            if (lanErr) {
              result.success = false;
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
            const { error: statusError } = await sb.from('lanzamientos').update({ plataformas_links: {
              ...(lan.plataformas_links || {}), youtube_metrics_attempted_at: collected.createdAt,
              youtube_metrics_status: 'error', youtube_metrics_error: stats.error || 'Métricas no disponibles'
            } }).eq('id', lan.id);
            if (statusError) result.success = false;
            result.warnings.push(`YouTube (${lan.slug}): ${stats.error || 'Métricas no disponibles'}; se conservan las cifras anteriores.`);
          }
        }
      }
    }
  } catch (err) {
    result.success = false;
    launchMetricsFailed++;
    result.warnings.push(`Error al actualizar lanzamientos: ${err.message}`);
  }

  if (launchMetricsAttempted > 0) {
    const metricsStatus = launchMetricsFailed > 0 || launchMetricsPartial > 0 ? 'warning' : 'success';
    result.launch_metrics = {
      status: metricsStatus,
      attempted: launchMetricsAttempted,
      updated: result.lanzamientos_updated.length,
      failed: launchMetricsFailed,
      partial: launchMetricsPartial
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
      result.success = false;
      result.warnings.push(`No se pudo registrar la auditoría de métricas: ${err.message}`);
    }
  }

  // --- PASO 3: ÚLTIMOS VIDEOS DE YOUTUBE VÍA RSS ---
  try {
    if (collected.rss.httpStatus === 200 && collected.rss.xml) {
      const xml = collected.rss.xml;
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
    } else result.warnings.push(`RSS YouTube: ${collected.rss.error || 'No se recibió un feed válido'}`);
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
  result.partial = result.warnings.length > 0;
  return result;
}

export async function GET({ request }) {
  if (process.env.VERCEL_ENV === 'preview') return jsonResponse({ success: false, error: 'Actualización deshabilitada en despliegues de prueba' }, 403);
  const auth = await authenticateRequest(request);
  if (!auth.authorized) {
    return jsonResponse({ success: false, error: 'No autorizado' }, 401);
  }

  try {
    const result = await executeSynchronization(auth.userEmail);
    return jsonResponse(result, result.success ? 200 : 500);
  } catch { return jsonResponse({ success: false, error: 'No se pudo completar la sincronización' }, 500); }
}

export async function POST({ request }) {
  if (process.env.VERCEL_ENV === 'preview') return jsonResponse({ success: false, error: 'Actualización deshabilitada en despliegues de prueba' }, 403);
  const auth = await authenticateRequest(request);
  if (!auth.authorized) {
    return jsonResponse({ success: false, error: 'No autorizado' }, 401);
  }

  let snapshot = null;
  if (request.headers.get('content-type')?.includes('application/json')) {
    if (!auth.isCron) return jsonResponse({ success: false, error: 'La recepción de métricas requiere autorización del cron' }, 403);
    const reader = request.body?.getReader();
    let bytes = 0, text = '';
    const decoder = new TextDecoder();
    try {
      if (!reader) throw new Error('Sin cuerpo');
      for (;;) { const { done, value } = await reader.read(); if (done) break;
        bytes += value.byteLength; if (bytes > 128 * 1024) { await reader.cancel(); return jsonResponse({ success: false, error: 'Solicitud demasiado grande' }, 413); }
        text += decoder.decode(value, { stream: true });
      }
      snapshot = JSON.parse(text + decoder.decode());
      if (!validateSnapshot(snapshot)) throw new Error('Snapshot inválido');
    } catch { return jsonResponse({ success: false, error: 'Métricas inválidas o vencidas' }, 400); }
  }
  try {
    const result = await executeSynchronization(auth.userEmail, snapshot);
    return jsonResponse(result, result.success ? 200 : 500);
  } catch { return jsonResponse({ success: false, error: 'No se pudo completar la sincronización' }, 500); }
}
