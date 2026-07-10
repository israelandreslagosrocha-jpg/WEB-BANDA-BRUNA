import type { APIRoute } from 'astro';
import { dbService } from '../../../modules/radio-monitor/services/dbService';
import { cacheService } from '../../../modules/radio-monitor/services/cacheService';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const search = url.searchParams.get('search') || undefined;
  const radioId = url.searchParams.get('radioId') || undefined;

  // Generamos una clave de caché única según los filtros provistos
  const cacheKey = `radio_history_${limit}_${search || 'all'}_${radioId || 'all'}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return new Response(JSON.stringify(cachedData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=20'
      }
    });
  }

  try {
    const history = await dbService.getRecentHistory(limit, { search, radioId });

    const responseData = {
      success: true,
      timestamp: new Date().toISOString(),
      history
    };

    // Cacheamos por 30 segundos en el servidor
    cacheService.set(cacheKey, responseData, 30 * 1000);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=20'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno al consultar historial de reproducciones'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
