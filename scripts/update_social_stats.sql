-- =====================================================================
-- ACTUALIZACIÓN OFICIAL DE SEGUIDORES Y REDES SOCIALES - BANDA BRUNA
-- Ejecutar en: Supabase Dashboard -> SQL Editor (https://supabase.com)
-- =====================================================================

UPDATE public.configuracion
SET 
  cant_instagram = 3359,
  cant_facebook = 5000,
  cant_youtube = 911,
  cant_tiktok = 1136,
  cant_trayectoria = 15,
  cant_escenarios = 10,
  cant_regiones = 5
WHERE id = 1;
