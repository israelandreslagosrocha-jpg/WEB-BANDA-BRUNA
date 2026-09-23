import { fetchVideoMetadata } from '../../../services/videoMetaFetcher.js';

export const prerender = false;

function corsResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function GET({ request }) {
  try {
    const requestUrl = new URL(request.url);
    const targetUrl = requestUrl.searchParams.get('url');

    if (!targetUrl || !targetUrl.trim()) {
      return corsResponse({
        success: false,
        error: 'El parámetro "url" es requerido.'
      }, 400);
    }

    const metadata = await fetchVideoMetadata(targetUrl.trim());
    return corsResponse(metadata, metadata.success ? 200 : 422);
  } catch (err) {
    console.error('[fetch-video-meta] Error procesando solicitud:', err);
    return corsResponse({
      success: false,
      error: err.message || 'Error interno del servidor al obtener metadatos'
    }, 500);
  }
}
