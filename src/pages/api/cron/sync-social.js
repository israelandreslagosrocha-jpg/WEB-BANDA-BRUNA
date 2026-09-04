// Endpoint Base de Sincronización Social — Fase P0 (Cerrado / No operativo)
// Proyecto: Banda Bruna
// Este endpoint está protegido y preparado estructuralmente para la Fase P1.
// En P0 NO ejecuta scraping activo ni llamadas a redes sociales.

export const prerender = false;

export async function GET({ request }) {
  // 1. Autenticación estricta con Bearer Token
  const cronSecret = process.env.CRON_SECRET || import.meta.env.CRON_SECRET;
  
  if (!cronSecret) {
    return new Response(JSON.stringify({
      success: false,
      error: 'CRON_SECRET no configurado en variables de entorno'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({
      success: false,
      error: 'No autorizado'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Respuesta base de andamiaje (Scraping inactivo en P0)
  return new Response(JSON.stringify({
    success: true,
    phase: 'P0_FOUNDATION',
    status: 'scaffolding_ready',
    message: 'Estructura de endpoint base verificada y protegida. El motor de scraping se activará en la Fase P1 tras validación de base de datos.'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
