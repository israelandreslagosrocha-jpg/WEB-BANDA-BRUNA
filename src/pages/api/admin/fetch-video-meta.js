import { fetchVideoMetadata } from '../../../services/videoMetaFetcher.js';
import { authenticateAdminRequest, jsonResponse } from '../../../services/serverAuth.js';

export const prerender = false;

export async function GET({ request }) {
  const auth = await authenticateAdminRequest(request);
  if (!auth.authorized) {
    return jsonResponse({ success: false, error: 'No autorizado' }, 401);
  }

  try {
    const requestUrl = new URL(request.url);
    const targetUrl = requestUrl.searchParams.get('url');

    if (!targetUrl || !targetUrl.trim()) {
      return jsonResponse({
        success: false,
        error: 'El parámetro "url" es requerido.'
      }, 400);
    }

    const metadata = await fetchVideoMetadata(targetUrl.trim());
    return jsonResponse(metadata, metadata.success ? 200 : 422);
  } catch (err) {
    console.error('[fetch-video-meta] Error procesando solicitud:', err);
    return jsonResponse({
      success: false,
      error: err.message || 'Error interno del servidor al obtener metadatos'
    }, 500);
  }
}
