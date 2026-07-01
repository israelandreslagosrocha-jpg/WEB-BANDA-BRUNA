-- SCRIPT DE ACTUALIZACIÓN DE HORA DE ESTRENO PARA "AHOGADO EN UN BAR"
-- Ejecutar en el editor SQL de Supabase (https://supabase.com/) para aplicar el cambio en producción.

UPDATE public.lanzamientos
SET fecha_lanzamiento = '2026-07-04 19:00:00-04'
WHERE slug = 'ahogado-en-un-bar';
