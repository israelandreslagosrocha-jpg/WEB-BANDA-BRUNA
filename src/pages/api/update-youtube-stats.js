export const prerender = false;
import { supabase } from '../../services/supabaseClient.js';

export async function GET({ request }) {
  const url = new URL(request.url);
  const videoId = url.searchParams.get('id') || 'mZhYl60ENAs';
  const slug = url.searchParams.get('slug') || '';
  const isAhogado = slug === 'ahogado-en-un-bar' || videoId === 'mZhYl60ENAs';
  const isPatrio = slug === 'sesion-fiestas-patrias' || videoId === 'yXvWp-3sNuM';
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const defaultViewsFloor = isAhogado ? 26578 : (isPatrio ? 8598 : 0);
  const defaultLikesFloor = isAhogado ? 243 : (isPatrio ? 122 : 0);

  let views = defaultViewsFloor;
  let likes = defaultLikesFloor;
  let fetchedLive = false;

  if (videoId) {
    try {
      const res = await fetch(youtubeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        const html = await res.text();
        const viewMatch = html.match(/"viewCount":"(\d+)"/);
        const likeMatch = html.match(/"likeCount":"(\d+)"/);

        if (viewMatch && parseInt(viewMatch[1], 10) > 0) {
          views = Math.max(views, parseInt(viewMatch[1], 10));
          fetchedLive = true;
        }
        if (likeMatch && parseInt(likeMatch[1], 10) > 0) {
          likes = Math.max(likes, parseInt(likeMatch[1], 10));
          fetchedLive = true;
        }
      }
    } catch (err) {
      // Si falla YouTube (por ejemplo bloqueo de IP datacenter en Vercel)
    }
  }

  // Si no se pudo obtener en vivo o devolvió menos que los datos registrados en Supabase
  try {
    const targetSlug = slug || (isAhogado ? 'ahogado-en-un-bar' : (isPatrio ? 'sesion-fiestas-patrias' : ''));
    if (targetSlug) {
      const { data } = await supabase
        .from('lanzamientos')
        .select('id, plataformas_links')
        .eq('slug', targetSlug)
        .single();

      if (data && data.plataformas_links) {
        const dbV = Number(data.plataformas_links.youtube_views) || 0;
        const dbL = Number(data.plataformas_links.youtube_likes) || 0;
        views = Math.max(views, dbV);
        likes = Math.max(likes, dbL);
      }
    }
  } catch (dbErr) {
    // Si falla Supabase, se preservan los valores floor calculados
  }

  return new Response(JSON.stringify({
    success: true,
    slug: slug || (isAhogado ? 'ahogado-en-un-bar' : (isPatrio ? 'sesion-fiestas-patrias' : '')),
    videoId,
    views,
    likes,
    fetchedLive,
    updated_at: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300'
    }
  });
}

