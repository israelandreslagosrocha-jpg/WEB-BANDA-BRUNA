import { createClient } from '@supabase/supabase-js';

/**
 * Obtiene o crea un cliente Supabase adecuado para operaciones server-side.
 * Prioriza SUPABASE_SERVICE_ROLE_KEY. Permite inyección de cliente para tests.
 */
export function getServiceClient(injectedClient = null) {
  if (injectedClient) return injectedClient;

  const url = process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Faltan credenciales de Supabase (PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY).');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * Obtiene todas las publicaciones existentes en base de datos para una plataforma.
 * Mapea por external_id para búsqueda O(1).
 */
export async function getExistingPostsMap(client, platform) {
  const { data, error } = await client
    .from('social_posts')
    .select('*')
    .eq('platform', platform);

  if (error) {
    console.warn(`[social-sync] Error al obtener posts existentes de ${platform}:`, error.message);
    return new Map();
  }

  const map = new Map();
  for (const post of data || []) {
    map.set(post.external_id, post);
  }
  return map;
}

/**
 * Inserta o actualiza un post mediante el stored procedure idempotente.
 * Mantiene intactos show_on_web y web_order.
 */
export async function persistScrapedPost(client, post) {
  const { error } = await client.rpc('upsert_scraped_social_post', {
    p_platform: post.platform,
    p_external_id: post.external_id,
    p_url: post.url,
    p_post_type: post.post_type || 'post',
    p_title: post.title ?? null,
    p_caption: post.caption ?? null,
    p_thumbnail_url: post.thumbnail_url ?? null,
    p_thumbnail_is_ephemeral: Boolean(post.thumbnail_is_ephemeral),
    p_published_at: post.published_at ?? null,
    p_likes: post.likes ?? 0,
    p_views: post.views ?? 0,
    p_comments: post.comments ?? 0
  });

  if (error) {
    throw new Error(`Fallo al persistir post ${post.external_id}: ${error.message}`);
  }
}

/**
 * Registra un fallo en un post existente respetando la regla de separación temporal (>= 12h para 404).
 */
export async function recordPostCheckFailure(client, existingPost, errorType) {
  if (!existingPost) return;

  const now = new Date();
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

  if (errorType === 'http_404') {
    const lastCheck = existingPost.last_scraped_at ? new Date(existingPost.last_scraped_at).getTime() : 0;
    const elapsed = now.getTime() - lastCheck;

    // Solo incrementar si nunca había fallado (count=0) o si transcurrieron >= 12h
    if (existingPost.consecutive_404_count === 0 || elapsed >= TWELVE_HOURS_MS) {
      const newCount = (existingPost.consecutive_404_count || 0) + 1;
      await client
        .from('social_posts')
        .update({
          consecutive_404_count: newCount,
          last_scraped_at: now.toISOString()
        })
        .eq('id', existingPost.id);
    }
  } else {
    // Error transitorio (403, 429, WAF, timeout): NO incrementar consecutive_404_count
    await client
      .from('social_posts')
      .update({
        last_scraped_at: now.toISOString()
      })
      .eq('id', existingPost.id);
  }
}

/**
 * Actualiza la información de la cuenta en social_accounts.
 */
export async function updateSocialAccount(client, platform, { followers_count, status, error_message = null }) {
  const updatePayload = {
    last_scraped_at: new Date().toISOString(),
    last_status: status,
    last_error_message: error_message,
    updated_at: new Date().toISOString()
  };

  if (followers_count !== null && followers_count !== undefined) {
    updatePayload.followers_count = followers_count;
  }

  const { error } = await client
    .from('social_accounts')
    .update(updatePayload)
    .eq('id', platform);

  if (error) {
    console.warn(`[social-sync] Error actualizando social_accounts para ${platform}:`, error.message);
  }
}

/**
 * Inserta un registro de auditoría y rendimiento en social_scrape_logs.
 */
export async function logScrapeRun(client, {
  run_type = 'feed_discovery',
  platform,
  started_at,
  status,
  items_detected = 0,
  items_updated = 0,
  error_type = 'none',
  error_details = null
}) {
  const finished_at = new Date();
  const duration_ms = finished_at.getTime() - new Date(started_at).getTime();

  const { error } = await client
    .from('social_scrape_logs')
    .insert([{
      run_type,
      platform,
      started_at: new Date(started_at).toISOString(),
      finished_at: finished_at.toISOString(),
      duration_ms,
      status,
      items_detected,
      items_updated,
      error_type,
      error_details
    }]);

  if (error) {
    console.warn(`[social-sync] Error insertando log en social_scrape_logs:`, error.message);
  }
}
