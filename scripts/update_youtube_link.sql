-- SCRIPT DE ACTUALIZACIÓN DE ENLACE DE YOUTUBE PARA "AHOGADO EN UN BAR"
-- Ejecutar en el editor SQL de Supabase para aplicar el cambio en producción.

UPDATE public.lanzamientos
SET plataformas_links = jsonb_set(
  jsonb_set(plataformas_links, '{youtube}', '"https://www.youtube.com/watch?v=mZhYl60ENAs"'),
  '{youtube_music}', '"https://music.youtube.com/watch?v=mZhYl60ENAs"'
)
WHERE slug = 'ahogado-en-un-bar';
