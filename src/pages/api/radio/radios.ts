import type { APIRoute } from 'astro';
import { dbService } from '../../../modules/radio-monitor/services/dbService';
import { cacheService } from '../../../modules/radio-monitor/services/cacheService';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const onlyActive = url.searchParams.get('onlyActive') !== 'false';

  const cacheKey = `radio_list_${onlyActive}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return new Response(JSON.stringify(cachedData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      }
    });
  }

  try {
    const radios = await dbService.getRadios(onlyActive);

    const responseData = {
      success: true,
      timestamp: new Date().toISOString(),
      radios
    };

    // Cacheamos por 1 minuto
    cacheService.set(cacheKey, responseData, 60 * 1000);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno al consultar listado de radios'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
