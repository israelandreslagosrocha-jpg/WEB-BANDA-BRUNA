import { authenticateAdminRequest, isValidCronRequest, createServiceSupabaseClient, jsonResponse } from '../../../services/serverAuth.js';
import { launchVideoId } from '../../../modules/social-sync/publicMetrics.js';
export const prerender = false;
export async function GET({ request }) {
  if (!isValidCronRequest(request) && !(await authenticateAdminRequest(request)).authorized) return jsonResponse({ success: false, error: 'No autorizado' }, 401);
  const { data, error } = await createServiceSupabaseClient().from('lanzamientos').select('slug, video_url, plataformas_links');
  if (error) return jsonResponse({ success: false, error: 'No se pudo leer el catálogo de lanzamientos' }, 500);
  return jsonResponse({ success: true, videos: [...new Set((data || []).map(launchVideoId).filter(Boolean))].slice(0, 30) });
}
