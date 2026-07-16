export const prerender = false;

export async function GET() {
  return new Response(JSON.stringify({
    success: true,
    message: 'La sincronización automática de estadísticas de YouTube ha sido desactivada. Las visualizaciones y me gusta ahora se configuran manualmente desde el panel de administración.'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

