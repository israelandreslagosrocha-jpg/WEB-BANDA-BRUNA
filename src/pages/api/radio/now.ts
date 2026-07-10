import type { APIRoute } from 'astro';
import { dbService } from '../../../modules/radio-monitor/services/dbService';
import { cacheService } from '../../../modules/radio-monitor/services/cacheService';

export const prerender = false; // Forza a ejecutar dinámicamente del lado del servidor (SSR)

export const GET: APIRoute = async () => {
  const cacheKey = 'radio_now_playing';
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return new Response(JSON.stringify(cachedData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10' // Caché del navegador por 10 segundos
      }
    });
  }

  try {
    const nowPlayingList = await dbService.getNowPlaying();
    // Filtramos las radios que actualmente tengan una canción registrada de Banda Bruna
    const activeDetections = nowPlayingList.filter(np => np.artist && np.title);

    const responseData = {
      success: true,
      timestamp: new Date().toISOString(),
      nowPlaying: activeDetections
    };

    // Cacheamos por 15 segundos en el servidor
    cacheService.set(cacheKey, responseData, 15 * 1000);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno al consultar reproducción actual'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
