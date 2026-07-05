-- SCRIPT DE ACTUALIZACIÓN DE ENLACE DE INSTAGRAM PARA "AHOGADO EN UN BAR"
-- Ejecutar en el editor SQL de Supabase para aplicar el cambio en producción.

UPDATE public.lanzamientos
SET plataformas_links = jsonb_set(
  plataformas_links,
  '{instagram}',
  '"https://www.instagram.com/p/DaY5-_YCctx/"'
)
WHERE slug = 'ahogado-en-un-bar';
