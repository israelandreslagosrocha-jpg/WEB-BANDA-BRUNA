export const prerender = false;
import { createPublicSupabaseClient } from '../../services/serverAuth.js';

export async function GET({ request }) {
  const url = new URL(request.url);
  const requestedVideoId = url.searchParams.get('id') || '';
  const slug = url.searchParams.get('slug') || '';
  const isAhogado = slug === 'ahogado-en-un-bar' || requestedVideoId === 'mZhYl60ENAs';
  const isPatrio = slug === 'sesion-fiestas-patrias' || requestedVideoId === 'yXvWp-3sNuM';
  const targetSlug = slug || (isAhogado ? 'ahogado-en-un-bar' : (isPatrio ? 'sesion-fiestas-patrias' : ''));

  if (!targetSlug || targetSlug.length > 120) return new Response(JSON.stringify({ success: false, error: 'Lanzamiento inválido' }), { status: 400 });
  let views = null, likes = null, updatedAt = null, attemptedAt = null, metricStatus = 'unverified';
  let viewsUpdatedAt = null, likesUpdatedAt = null;

  // Esta ruta no hace scraping: devuelve únicamente el último dato diario
  // persistido por /api/cron/sync-social, incluso si alguien la consulta directo.
  try {
    if (targetSlug) {
      const { data, error } = await createPublicSupabaseClient()
        .from('lanzamientos')
        .select('id, plataformas_links')
        .eq('slug', targetSlug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return new Response(JSON.stringify({ success: false, error: 'Lanzamiento no encontrado' }), { status: 404 });

      if (data && data.plataformas_links) {
        const links = data.plataformas_links;
        const count = value => value !== null && value !== undefined && Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
        views = count(links.youtube_views);
        likes = count(links.youtube_likes);
        updatedAt = links.youtube_metrics_updated_at || null;
        viewsUpdatedAt = links.youtube_views_updated_at || null;
        likesUpdatedAt = links.youtube_likes_updated_at || null;
        attemptedAt = links.youtube_metrics_attempted_at || null;
        metricStatus = links.youtube_metrics_status || 'unverified';
      }
    }
  } catch (dbErr) {
    return new Response(JSON.stringify({ success: false, error: 'No se pudieron leer las métricas almacenadas' }), { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }

  return new Response(JSON.stringify({
    success: true,
    slug: targetSlug,
    videoId: requestedVideoId || (isAhogado ? 'mZhYl60ENAs' : (isPatrio ? 'yXvWp-3sNuM' : '')),
    views,
    likes,
    fetchedLive: false,
    updated_at: updatedAt,
    views_updated_at: viewsUpdatedAt,
    likes_updated_at: likesUpdatedAt,
    last_attempt_at: attemptedAt,
    status: metricStatus,
    stale: metricStatus !== 'ok' || !updatedAt || !Number.isFinite(Date.parse(updatedAt)) || Date.now() - Date.parse(updatedAt) > 36 * 60 * 60 * 1000
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300'
    }
  });
}
