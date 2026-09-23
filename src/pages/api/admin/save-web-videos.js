import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fetchVideoMetadata } from '../../../services/videoMetaFetcher.js';

export const prerender = false;

// 1. Cliente Supabase con Service Role o Bearer Auth
function getSupabaseClient(authToken = null) {
  const url = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Variables de entorno de Supabase faltantes.');
  }

  const options = {
    auth: { persistSession: false, autoRefreshToken: false }
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

// 2. Autenticación de usuario administrador
async function authenticateAdmin(request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // En entorno local permitir desarrollo si no hay token
  const host = request.headers.get('host') || '';
  if ((host.includes('localhost') || host.includes('127.0.0.1')) && !token) {
    return { authorized: true, userEmail: 'admin@localhost', token: null };
  }

  if (!token) {
    return { authorized: false, userEmail: null, token: null };
  }

  try {
    const sb = getSupabaseClient(token);
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (!error && user && (user.email === 'contacto@bandabruna.cl' || user.role === 'authenticated')) {
      return { authorized: true, userEmail: user.email, token };
    }
  } catch (err) {
    console.warn('[save-web-videos] Error validando JWT:', err.message);
  }

  return { authorized: false, userEmail: null, token: null };
}

// 3. Extraer ID de YouTube
function extractYouTubeId(url) {
  if (!url) return null;
  const str = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|(?:shorts\/))|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = str.match(regExp);
  return match ? match[1] : null;
}

// 4. Extraer ID de Facebook Reel
function extractFacebookId(url, index) {
  if (!url) return `fb_${index}`;
  const str = url.trim();
  const match = str.match(/(?:reel|videos|watch|share\/r)\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : `fb_${index}`;
}

// 5. Extraer ID / Shortcode de Instagram Reel
function extractInstagramId(url, index) {
  if (!url) return `ig_${index}`;
  const str = url.trim();
  const match = str.match(/(?:reel|p)\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : `ig_${index}`;
}

// 6. Extraer ID de TikTok
function extractTikTokId(url, index) {
  if (!url) return `tt_${index}`;
  const str = url.trim();
  const match = str.match(/video\/([0-9]+)/i);
  return match ? match[1] : `tt_${index}`;
}

// Respuestas con CORS
function corsResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// GET: Retornar los videos curados actuales de la base de datos
export async function GET({ request }) {
  try {
    const sb = getSupabaseClient();
    const { data: posts, error } = await sb
      .from('social_posts')
      .select('*')
      .in('platform', ['youtube', 'facebook', 'instagram', 'tiktok'])
      .eq('show_on_web', true)
      .not('web_order', 'is', null)
      .order('web_order', { ascending: true });

    if (error) {
      return corsResponse({ success: false, error: error.message }, 500);
    }

    // Cargar respaldo curatedVideos.json si existe para complementar portadas CDN
    let curatedFallback = null;
    try {
      const dataFile = path.join(process.cwd(), 'src', 'data', 'curatedVideos.json');
      if (fs.existsSync(dataFile)) {
        curatedFallback = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      }
    } catch {}

    const grouped = {
      youtube: [],
      facebook: [],
      instagram: [],
      tiktok: []
    };

    (posts || []).forEach(post => {
      if (grouped[post.platform]) {
        const orderIdx = (post.web_order || 1) - 1;
        const fallbackItem = curatedFallback?.[post.platform]?.[orderIdx];
        let thumbnail = post.thumbnail_url || '';
        if ((!thumbnail || thumbnail.startsWith('/assets/images/')) && fallbackItem?.thumbnail) {
          thumbnail = fallbackItem.thumbnail;
        }

        grouped[post.platform].push({
          id: post.external_id,
          order: post.web_order,
          url: post.url,
          title: post.title || post.caption || fallbackItem?.title || '',
          thumbnail,
          duration: post.post_type === 'short' ? 'Short' : 'Oficial',
          category: post.platform
        });
      }
    });

    return corsResponse({ success: true, videos: grouped });
  } catch (err) {
    return corsResponse({ success: false, error: err.message }, 500);
  }
}

// POST: Guardar y actualizar los 20 videos en Supabase
export async function POST({ request }) {
  const auth = await authenticateAdmin(request);
  if (!auth.authorized) {
    return corsResponse({ success: false, error: 'No autorizado. Se requiere sesión de administrador.' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return corsResponse({ success: false, error: 'Cuerpo de solicitud inválido (JSON esperado).' }, 400);
  }

  const platforms = ['youtube', 'facebook', 'instagram', 'tiktok'];
  const sb = getSupabaseClient(auth.token);
  const summary = {
    updated: 0,
    created: 0,
    errors: []
  };

  try {
    for (const plat of platforms) {
      const slots = Array.isArray(body[plat]) ? body[plat] : [];
      
      // Obtener posts existentes de esta plataforma con web_order asignado
      const { data: existingRows } = await sb
        .from('social_posts')
        .select('*')
        .eq('platform', plat);

      // Guardar cada uno de los 5 slots
      for (let i = 0; i < 5; i++) {
        const slot = slots[i] || {};
        const url = (slot.url || '').trim();
        const order = i + 1;

        if (!url) continue;

        let externalId = '';
        let thumbnail = (slot.thumbnail || '').trim();
        let title = (slot.title || '').trim();
        let postType = 'video';

        // Si no se proporcionó thumbnail o es un placeholder genérico local, extraer metadatos automáticamente
        let fetchedMeta = null;
        if (!thumbnail || thumbnail.startsWith('/assets/images/')) {
          try {
            fetchedMeta = await fetchVideoMetadata(url);
          } catch (metaErr) {
            console.warn(`[save-web-videos] No se pudo extraer metadatos para ${url}:`, metaErr.message);
          }
        }

        if (plat === 'youtube') {
          const ytId = extractYouTubeId(url);
          externalId = ytId || `yt_custom_${order}`;
          if (fetchedMeta?.thumbnail) {
            thumbnail = fetchedMeta.thumbnail;
          } else if (!thumbnail && ytId) {
            thumbnail = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
          }
          if (fetchedMeta?.title && (!title || title.startsWith('Banda Bruna - Video Oficial'))) {
            title = fetchedMeta.title;
          } else if (!title) {
            title = 'Banda Bruna - Video Oficial en YouTube';
          }
          postType = url.includes('/shorts/') ? 'short' : 'video';
        } else if (plat === 'facebook') {
          externalId = extractFacebookId(url, order);
          if (fetchedMeta?.thumbnail) {
            thumbnail = fetchedMeta.thumbnail;
          } else if (!thumbnail) {
            thumbnail = '/assets/images/facebook/fb_fiestas_patrias.webp';
          }
          if (fetchedMeta?.title && (!title || title.startsWith('Banda Bruna en vivo'))) {
            title = fetchedMeta.title;
          } else if (!title) {
            title = 'Banda Bruna en vivo - Facebook Reel';
          }
          postType = 'reel';
        } else if (plat === 'instagram') {
          externalId = extractInstagramId(url, order);
          if (fetchedMeta?.thumbnail) {
            thumbnail = fetchedMeta.thumbnail;
          } else if (!thumbnail) {
            thumbnail = '/assets/images/instagram/ig_boca_de_lobos.webp';
          }
          if (fetchedMeta?.title && (!title || title.startsWith('Banda Bruna en Instagram'))) {
            title = fetchedMeta.title;
          } else if (!title) {
            title = 'Banda Bruna en Instagram';
          }
          postType = 'reel';
        } else if (plat === 'tiktok') {
          externalId = extractTikTokId(url, order);
          if (fetchedMeta?.thumbnail) {
            thumbnail = fetchedMeta.thumbnail;
          } else if (!thumbnail) {
            thumbnail = '/assets/images/tiktok/tiktok_minero.webp';
          }
          if (fetchedMeta?.title && (!title || title.startsWith('Banda Bruna Oficial'))) {
            title = fetchedMeta.title;
          } else if (!title) {
            title = 'Banda Bruna Oficial en TikTok';
          }
          postType = 'video';
        }

        // Actualizar el slot en memoria para que el archivo de respaldo local también guarde la portada real
        slot.thumbnail = thumbnail;
        slot.title = title;

        // Buscar si ya existe una fila para este slot específico (por web_order)
        const existingByOrder = (existingRows || []).find(r => r.web_order === order);
        const existingById = (existingRows || []).find(r => r.external_id === externalId);

        const targetRow = existingByOrder || existingById;

        const payload = {
          platform: plat,
          url,
          title,
          caption: title,
          thumbnail_url: thumbnail,
          post_type: postType,
          web_order: order,
          show_on_web: true,
          disponible: true,
          updated_at: new Date().toISOString()
        };

        if (targetRow) {
          // Si el externalId cambió, asegurar que no colisione
          if (targetRow.external_id !== externalId && !existingById) {
            payload.external_id = externalId;
          }

          const { error: updErr } = await sb
            .from('social_posts')
            .update(payload)
            .eq('id', targetRow.id);

          if (updErr) summary.errors.push(`Error al actualizar ${plat} slot ${order}: ${updErr.message}`);
          else summary.updated++;
        } else {
          payload.external_id = externalId;
          const { error: insErr } = await sb
            .from('social_posts')
            .insert([payload]);

          if (insErr) summary.errors.push(`Error al insertar ${plat} slot ${order}: ${insErr.message}`);
          else summary.created++;
        }
      }
    }

    // Registrar en auditoría
    try {
      await sb.from('logs_actividad').insert([{
        usuario_email: auth.userEmail,
        accion: 'Actualizó los 20 enlaces de videos y reels de la web (YouTube, Facebook, Instagram, TikTok)',
        created_at: new Date().toISOString()
      }]);
    } catch {}

    // Guardar respaldo local en JSON para alta disponibilidad
    try {
      const dataDir = path.join(process.cwd(), 'src', 'data');
      if (fs.existsSync(dataDir)) {
        fs.writeFileSync(
          path.join(dataDir, 'curatedVideos.json'),
          JSON.stringify(body, null, 2),
          'utf8'
        );
      }
    } catch (fsErr) {
      console.warn('No se pudo guardar respaldo local curatedVideos.json:', fsErr.message);
    }

    return corsResponse({
      success: summary.errors.length === 0,
      summary,
      message: summary.errors.length === 0 
        ? 'Todos los videos de la web han sido actualizados y guardados exitosamente.'
        : 'Algunos videos se actualizaron con advertencias.'
    });
  } catch (err) {
    return corsResponse({ success: false, error: err.message }, 500);
  }
}
