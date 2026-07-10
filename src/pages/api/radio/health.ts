import type { APIRoute } from 'astro';
import { dbService } from '../../../modules/radio-monitor/services/dbService';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const health = await dbService.getSystemHealth();

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      health
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate' // Sin caché para reporte en tiempo real
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error interno al consultar salud del motor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
