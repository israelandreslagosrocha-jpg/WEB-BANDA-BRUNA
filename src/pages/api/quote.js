import { createServiceSupabaseClient, jsonResponse } from '../../services/serverAuth.js';
import {
  allowPublicSubmission,
  cleanText,
  isSameOriginRequest
} from '../../services/publicRequestGuards.js';

export const prerender = false;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function POST({ request }) {
  if (!isSameOriginRequest(request)) {
    return jsonResponse({ success: false, error: 'Origen no permitido.' }, 403);
  }

  const contentLength = Number.parseInt(request.headers.get('content-length') || '0', 10);
  if (Number.isFinite(contentLength) && contentLength > 12_000) {
    return jsonResponse({ success: false, error: 'Solicitud demasiado grande.' }, 413);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Solicitud inválida.' }, 400);
  }

  // El campo señuelo nunca se muestra a visitantes reales.
  if (cleanText(body?.website, 200)) {
    return jsonResponse({ success: true }, 202);
  }

  const rateLimit = allowPublicSubmission(request, 'quote', { limit: 4, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ success: false, error: 'Demasiadas solicitudes. Intenta nuevamente más tarde.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': String(rateLimit.retryAfterSeconds)
      }
    });
  }

  const nombre = cleanText(body?.nombre, 100);
  const telefono = cleanText(body?.telefono, 40);
  const email = cleanText(body?.email, 254).toLowerCase();
  const fechaEvento = cleanText(body?.fecha_evento, 10);
  const ciudad = cleanText(body?.ciudad, 100);
  const tipoEvento = cleanText(body?.tipo_evento, 180);
  const mensaje = cleanText(body?.mensaje, 2_000) || 'Sin detalles adicionales.';

  if (
    nombre.length < 2
    || telefono.length < 6
    || !EMAIL_PATTERN.test(email)
    || !isValidDate(fechaEvento)
    || ciudad.length < 2
    || tipoEvento.length < 2
  ) {
    return jsonResponse({ success: false, error: 'Revisa los datos obligatorios de la cotización.' }, 400);
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.from('cotizaciones').insert({
      nombre,
      telefono,
      email,
      fecha_evento: fechaEvento,
      ciudad,
      tipo_evento: tipoEvento,
      mensaje
    });

    if (error) {
      console.error('[quote] No se pudo guardar la cotización:', error.message);
      return jsonResponse({ success: false, error: 'No se pudo registrar la solicitud.' }, 500);
    }

    return jsonResponse({ success: true }, 201);
  } catch (error) {
    console.error('[quote] Error interno:', error.message);
    return jsonResponse({ success: false, error: 'No se pudo registrar la solicitud.' }, 500);
  }
}
