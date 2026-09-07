import { createClient } from '@supabase/supabase-js';
import { parseYouTubeRssFeed, scrapeYouTubeSubscribers } from '../../../modules/social-sync/scrapers/youtube.js';
import { scrapeInstagramFollowers } from '../../../modules/social-sync/scrapers/instagram.js';
import { getVideoPlaylists } from '../../../services/socialApi.js';
import { parseCount } from '../../../modules/social-sync/types.js';

export const prerender = false;

// 1. Obtener cliente de Supabase server-side seguro
function getSupabaseClient(authToken = null) {
  const url = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Variables de entorno de Supabase faltantes.');
  }

  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  };

  if (authToken && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    options.global = {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    };
  }

  return createClient(url, key, options);
}

// 2. Validación de autorización (Vercel Cron O Usuario Administrador de Supabase)
async function authenticateRequest(request) {
  const cronSecret = process.env.CRON_SECRET || import.meta.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // Caso A: Cron Secret de Vercel
  if (cronSecret && token === cronSecret) {
    return { authorized: true, userEmail: 'cron@bandabruna.cl', isCron: true, token: null };
  }

  // Caso B: Token JWT de Supabase desde el Dashboard de Admin
  if (token) {
    try {
      const sb = getSupabaseClient();
      const { data: { user }, error } = await sb.auth.getUser(token);
      if (!error && user && (user.email === 'contacto@bandabruna.cl' || user.role === 'authenticated')) {
        return { authorized: true, userEmail: user.email, isCron: false, token };
      }
    } catch (err) {
      console.warn('[sync-social] Error al validar JWT de usuario:', err.message);
    }
  }

  // Caso C: En desarrollo local (localhost) permitimos ejecución si no hay secreto o viene bypass
  const host = request.headers.get('host') || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return { authorized: true, userEmail: 'contacto@bandabruna.cl (local)', isCron: false, token: token || null };
  }

  return { authorized: false, userEmail: null, isCron: false, token: null };
}

// 3. Consulta de métricas desde Google Sheets (respaldo consolidado)
async function fetchGoogleSheetsStats() {
  const sheetId = '1im9i2l0LuXuUdIGFpQq3u7Gxw5Rh_nnPDC0uB7x8QdY';
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

  try {
    const res = await fetch(gvizUrl, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!match) throw new Error('Formato no reconocido');

    const json = JSON.parse(match[1]);
    const rows = json.table?.rows || [];

    const stats = {};
    rows.forEach(row => {
      if (row.c && row.c[0] && row.c[1]) {
        const platform = String(row.c[0].v).toLowerCase().trim();
        const value = parseInt(row.c[1].v, 10);
        if (!isNaN(value) && value > 0) {
          stats[platform] = value;
        }
      }
    });
    return stats;
  } catch (err) {
    console.warn('[sync-social] No se pudo consultar Google Sheets:', err.message);
    return {};
  }
}

// 4. Scrape en vivo de YouTube para "Ahogado en un Bar"
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

// 4.1 Scrape de seguidores de TikTok
async function scrapeTikTokFollowers() {
  const candidateUserAgents = [
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Twitterbot/1.0',
    'WhatsApp/2.21.12.21 A',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  ];

  for (const ua of candidateUserAgents) {
    try {
      const res = await fetch('https://www.tiktok.com/@bandabrunaoficial', {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8'
        },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const html = await res.text();
        const descMatch = html.match(/<meta\s+(?:name|property)="(?:description|og:description)"\s+content="([^"]+)"/i);
        if (descMatch) {
          const m = descMatch[1].match(/([0-9.,KkMm]+)\s*(?:seguidores|followers)/i);
          if (m) {
            const parsed = parseCount(m[1]);
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
      // continuar con siguiente UA
    }
  }

  try {
    const ubRes = await fetch('https://urlebird.com/user/bandabrunaoficial/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (ubRes.ok) {
      const html = await ubRes.text();
      const match = html.match(/class="info-user"[\s\S]*?<strong>([0-9.,KkMm]+)<\/strong>\s*followers/i) ||
                    html.match(/([0-9.,KkMm]+)\s*followers/i);
      if (match) {
        const parsed = parseCount(match[1]);
        if (parsed && parsed > 500) return parsed;
      }
    }
  } catch (err) {
    console.warn('[sync-social] Urlebird para TikTok no disponible:', err.message);
  }

  return null;
}

// 4.2 Scrape de seguidores de Facebook
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

// 5. Orquestador central de Sincronización
async function executeSynchronization(userEmail, userToken) {
  const startedAt = new Date();
  const sb = getSupabaseClient(userToken);
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

  // --- PASO 1: SUSCRIPTORES Y SEGUIDORES (YouTube, Instagram, TikTok, Facebook) ---
  const sheetStats = await fetchGoogleSheetsStats();
  const ytSubsScraped = await scrapeYouTubeSubscribers();
  const igFollowersScraped = await scrapeInstagramFollowers();
  const ttFollowersScraped = await scrapeTikTokFollowers();
  const fbFollowersScraped = await scrapeFacebookFollowers();

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

  // REGLA DE ORO DE PRIORIDAD:
  // 1. Scrape en vivo directo (si extrae un número válido).
  // 2. Valor previo en configuracion (prevConfig, el cual el usuario puede forzar o ajustar manualmente).
  //    Si el scraping falla o retorna null, SE PRESERVA estrictamente el valor previo y no se decrementa.
  // 3. Planilla de respaldo Google Sheets (solo si prevConfig no existe o es 0).
  // 4. Base mínima garantizada.
  const finalYoutube = ytSubsScraped
    ? Math.max(ytSubsScraped, prevYoutube)
    : (prevYoutube || sheetStats.youtube || 911);

  const finalInstagram = igFollowersScraped
    ? Math.max(igFollowersScraped, prevInstagram)
    : (prevInstagram || sheetStats.instagram || 3366);

  const finalTiktok = ttFollowersScraped
    ? Math.max(ttFollowersScraped, prevTiktok)
    : (prevTiktok || sheetStats.tiktok || 1139);

  const finalFacebook = fbFollowersScraped
    ? Math.max(fbFollowersScraped, prevFacebook)
    : (prevFacebook || sheetStats.facebook || 4971);

  result.metrics = {
    youtube: finalYoutube,
    instagram: finalInstagram,
    tiktok: finalTiktok,
    facebook: finalFacebook
  };

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
    result.warnings.push(`Error al actualizar configuracion: ${confErr.message}`);
  }

  // Actualizar tabla social_accounts si existe
  try {
    const accounts = [
      { id: 'youtube', followers_count: finalYoutube },
      { id: 'instagram', followers_count: finalInstagram },
      { id: 'tiktok', followers_count: finalTiktok },
      { id: 'facebook', followers_count: finalFacebook }
    ];

    for (const acc of accounts) {
      await sb
        .from('social_accounts')
        .update({
          followers_count: acc.followers_count,
          last_scraped_at: new Date().toISOString(),
          last_status: 'ok',
          updated_at: new Date().toISOString()
        })
        .eq('id', acc.id);
    }
  } catch (err) {
    // Si la tabla no está creada, no bloquea el proceso
  }

  // --- PASO 2: ESTADÍSTICAS DEL VIDEOCLIP "AHOGADO EN UN BAR" ---
  const ahogadoStats = await fetchYouTubeVideoStats('mZhYl60ENAs');
  result.ahogado_stats = ahogadoStats;

  try {
    // Actualizar en tabla lanzamientos
    const { data: lanzamiento } = await sb
      .from('lanzamientos')
      .select('id, plataformas_links')
      .eq('slug', 'ahogado-en-un-bar')
      .maybeSingle();

    if (lanzamiento) {
      const currentLinks = lanzamiento.plataformas_links || {};
      const updatedLinks = {
        ...currentLinks,
        youtube_views: Math.max(ahogadoStats.views || 0, Number(currentLinks.youtube_views) || 0, 26249),
        youtube_likes: Math.max(ahogadoStats.likes || 0, Number(currentLinks.youtube_likes) || 0, 239)
      };

      await sb
        .from('lanzamientos')
        .update({
          plataformas_links: updatedLinks,
          updated_at: new Date().toISOString()
        })
        .eq('id', lanzamiento.id);
    }
  } catch (err) {
    result.warnings.push(`Error al actualizar lanzamientos: ${err.message}`);
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
            show_on_web: true,
            web_order: i < 5 ? i + 1 : null,
            last_scraped_at: new Date().toISOString()
          };

          // Si es el video de ahogado en un bar, agregar métricas
          if (p.external_id === 'mZhYl60ENAs' && ahogadoStats.views) {
            postPayload.views = ahogadoStats.views;
            postPayload.likes = ahogadoStats.likes;
          }

          const { error: upsertErr } = await sb
            .from('social_posts')
            .upsert(postPayload, { onConflict: 'platform,external_id' });

          if (!upsertErr) {
            result.youtube_posts_synced++;
          }
        }
      }
    }
  } catch (err) {
    result.warnings.push(`Error al sincronizar feed RSS de YouTube: ${err.message}`);
  }

  // --- PASO 4: CATÁLOGO DE VIDEOS Y REELS (FACEBOOK, INSTAGRAM, TIKTOK) ---
  // Asegura que en social_posts existan los 5 reels y videos de cada red para la sección VIDEOS
  try {
    const playlists = getVideoPlaylists();
    const platformsToSync = ['facebook', 'instagram', 'tiktok'];

    for (const plat of platformsToSync) {
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
        }
      }
    }
  } catch (err) {
    result.warnings.push(`Error al asegurar catálogo de videos/reels: ${err.message}`);
  }

  // --- PASO 5: REGISTRO EN BITÁCORA DE AUDITORÍA ---
  try {
    const logActionText = `Sincronización completa de redes (YT: ${finalYoutube}, IG: ${finalInstagram}, TT: ${finalTiktok}, FB: ${finalFacebook}). Ahogado en un Bar vistas: ${ahogadoStats.views || 'mantenidas'}`;
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

// 6. Handlers GET y POST
export async function GET({ request }) {
  const auth = await authenticateRequest(request);
  if (!auth.authorized) {
    return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const result = await executeSynchronization(auth.userEmail, auth.token);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  const auth = await authenticateRequest(request);
  if (!auth.authorized) {
    return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const result = await executeSynchronization(auth.userEmail, auth.token);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
