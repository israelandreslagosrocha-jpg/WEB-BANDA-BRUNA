-- =====================================================================
-- ACTUALIZACIÓN DE ESTADÍSTICAS OFICIALES DE YOUTUBE - "AHOGADO EN UN BAR"
-- Ejecutar en: Supabase Dashboard -> SQL Editor (https://supabase.com)
-- =====================================================================

UPDATE public.lanzamientos
SET plataformas_links = jsonb_set(
  jsonb_set(COALESCE(plataformas_links, '{}'::jsonb), '{youtube_views}', '26249'),
  '{youtube_likes}', '239'
)
WHERE slug = 'ahogado-en-un-bar';
