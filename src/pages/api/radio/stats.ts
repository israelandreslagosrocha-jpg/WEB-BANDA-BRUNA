import type { APIRoute } from 'astro';
import { dbService } from '../../../modules/radio-monitor/services/dbService';
import { cacheService } from '../../../modules/radio-monitor/services/cacheService';

export const prerender = false;

export const GET: APIRoute = async () => {
  const cacheKey = 'radio_monitoring_stats';
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return new Response(JSON.stringify(cachedData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120' // 2 minutos caché de navegador
      }
    });
  }

  try {
    const stats = await dbService.getStats();

    const responseData = {
      success: true,
      timestamp: new Date().toISOString(),
      stats
    };

    // Cacheamos por 5 minutos en el servidor para evitar cómputos SQL repetitivos
    cacheService.set(cacheKey, responseData, 5 * 60 * 1000);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno al procesar estadísticas'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
