-- ============================================================================
-- MIGRACIÓN P2: ÍNDICE ÚNICO PARCIAL PARA INTEGRIDAD DE WEB_ORDER EN POSTGRESQL
-- Proyecto: Banda Bruna
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================================================

-- Impide físicamente colisiones de web_order entre publicaciones activas en web
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_posts_web_order_unique 
ON public.social_posts (web_order) 
WHERE show_on_web = true AND disponible = true AND web_order IS NOT NULL;
