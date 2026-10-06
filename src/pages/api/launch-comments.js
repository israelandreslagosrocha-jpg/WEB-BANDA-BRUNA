import { createServiceSupabaseClient, jsonResponse } from '../../services/serverAuth.js';
import {
  allowPublicSubmission,
  cleanText,
  isSameOriginRequest
} from '../../services/publicRequestGuards.js';

export const prerender = false;

function isValidSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 120;
}

export async function GET({ request }) {
  const slug = cleanText(new URL(request.url).searchParams.get('slug'), 120);
  if (!isValidSlug(slug)) {
    return jsonResponse({ success: false, error: 'Lanzamiento inválido.' }, 400);
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('comentarios_lanzamientos')
      .select('id, nombre, ciudad, comentario, calificacion, created_at')
      .eq('lanzamiento_slug', slug)
      .eq('aprobado', true)
      .order('created_at', { ascending: false })
      .limit(60);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, comments: data || [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60'
      }
    });
  } catch (error) {
    console.error('[launch-comments] Error al leer comentarios:', error.message);
    return jsonResponse({ success: false, error: 'No se pudieron cargar las opiniones.' }, 500);
  }
}

export async function POST({ request }) {
  if (!isSameOriginRequest(request)) {
    return jsonResponse({ success: false, error: 'Origen no permitido.' }, 403);
  }

  const contentLength = Number.parseInt(request.headers.get('content-length') || '0', 10);
  if (Number.isFinite(contentLength) && contentLength > 6_000) {
    return jsonResponse({ success: false, error: 'Solicitud demasiado grande.' }, 413);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Solicitud inválida.' }, 400);
  }

  if (cleanText(body?.website, 200)) {
    return jsonResponse({ success: true }, 202);
  }

  const rateLimit = allowPublicSubmission(request, 'launch-comment', { limit: 3, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ success: false, error: 'Demasiadas opiniones enviadas. Intenta nuevamente más tarde.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': String(rateLimit.retryAfterSeconds)
      }
    });
  }

  const nombre = cleanText(body?.nombre, 80);
  const ciudad = cleanText(body?.ciudad, 80) || null;
  const comentario = cleanText(body?.comentario, 600);
  const lanzamientoSlug = cleanText(body?.lanzamiento_slug, 120);
  const calificacion = Number.parseInt(body?.calificacion, 10);

  if (
    nombre.length < 2
    || comentario.length < 3
    || !isValidSlug(lanzamientoSlug)
    || !Number.isInteger(calificacion)
    || calificacion < 1
    || calificacion > 5
  ) {
    return jsonResponse({ success: false, error: 'Revisa los datos de tu opinión.' }, 400);
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.from('comentarios_lanzamientos').insert({
      nombre,
      ciudad,
      comentario,
      calificacion,
      lanzamiento_slug: lanzamientoSlug,
      aprobado: false
    });

    if (error) throw error;
    return jsonResponse({ success: true }, 201);
  } catch (error) {
    console.error('[launch-comments] Error al guardar comentario:', error.message);
    return jsonResponse({ success: false, error: 'No se pudo enviar la opinión.' }, 500);
  }
}
