export const prerender = false;
import { supabase } from '../../services/supabaseClient.js';

export async function GET({ request }) {
  const url = new URL(request.url);
  const requestedVideoId = url.searchParams.get('id') || '';
  const slug = url.searchParams.get('slug') || '';
  const isAhogado = slug === 'ahogado-en-un-bar' || requestedVideoId === 'mZhYl60ENAs';
  const isPatrio = slug === 'sesion-fiestas-patrias' || requestedVideoId === 'yXvWp-3sNuM';
  const targetSlug = slug || (isAhogado ? 'ahogado-en-un-bar' : (isPatrio ? 'sesion-fiestas-patrias' : ''));

  const defaultViewsFloor = isAhogado ? 26578 : (isPatrio ? 8598 : 0);
  const defaultLikesFloor = isAhogado ? 243 : (isPatrio ? 122 : 0);

  let views = defaultViewsFloor;
  let likes = defaultLikesFloor;

  // Esta ruta no hace scraping: devuelve únicamente el último dato diario
  // persistido por /api/cron/sync-social, incluso si alguien la consulta directo.
  try {
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
    slug: targetSlug,
    videoId: requestedVideoId || (isAhogado ? 'mZhYl60ENAs' : (isPatrio ? 'yXvWp-3sNuM' : '')),
    views,
    likes,
    fetchedLive: false,
    updated_at: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300'
    }
  });
}
