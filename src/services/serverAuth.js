import { createClient } from '@supabase/supabase-js';

export const ADMIN_EMAIL = 'contacto@bandabruna.cl';

function env(name) {
  return process.env[name] || import.meta.env[name];
}

function getSupabaseUrl() {
  return env('SUPABASE_URL') || env('PUBLIC_SUPABASE_URL');
}

function getAnonKey() {
  return env('SUPABASE_ANON_KEY') || env('PUBLIC_SUPABASE_ANON_KEY');
}

export function createPublicSupabaseClient() {
  const url = getSupabaseUrl();
  const anonKey = getAnonKey();

  if (!url || !anonKey) {
    throw new Error('Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY.');
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function createServiceSupabaseClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    throw new Error('Faltan SUPABASE_URL y SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY) en el servidor.');
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function getBearerToken(request) {
  const header = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

export async function authenticateAdminRequest(request) {
  const token = getBearerToken(request);
  if (!token) return { authorized: false, userEmail: null };

  try {
    const authClient = createPublicSupabaseClient();
    const { data: { user }, error } = await authClient.auth.getUser(token);
    const email = user?.email?.toLowerCase();

    if (!error && email === ADMIN_EMAIL) {
      return { authorized: true, userEmail: email };
    }
  } catch (error) {
    console.warn('[serverAuth] No se pudo validar la sesión de administrador:', error.message);
  }

  return { authorized: false, userEmail: null };
}

export function isValidCronRequest(request) {
  const cronSecret = env('CRON_SECRET');
  const token = getBearerToken(request);

  // No existe una clave de respaldo: una ruta cron mal configurada debe fallar cerrada.
  return Boolean(cronSecret && token && token === cronSecret);
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
