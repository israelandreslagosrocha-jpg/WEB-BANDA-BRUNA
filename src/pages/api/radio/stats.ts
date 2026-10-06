import type { APIRoute } from 'astro';
import { dbService } from '../../../modules/radio-monitor/services/dbService';
import { cacheService } from '../../../modules/radio-monitor/services/cacheService';
import { authenticateAdminRequest, jsonResponse } from '../../../services/serverAuth.js';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const admin = await authenticateAdminRequest(request);
  if (!admin.authorized) {
    return jsonResponse({ success: false, error: 'No autorizado' }, 401);
  }

  const cacheKey = 'radio_monitoring_stats';
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return new Response(JSON.stringify(cachedData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store'
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
        'Cache-Control': 'private, no-store'
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
