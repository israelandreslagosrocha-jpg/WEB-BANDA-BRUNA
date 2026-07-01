-- =====================================================================
-- SCRIPT DE LIMPIEZA DE DESCARGAS DUPLICADAS - BANDA BRUNA 2.0
-- =====================================================================
-- Ejecuta este script en el editor SQL de tu consola de Supabase 
-- para eliminar los registros duplicados y restaurar las 6 descargas
-- oficiales.
-- =====================================================================

-- 1. Limpiar completamente la tabla de descargas
DELETE FROM public.downloads;

-- 2. Insertar únicamente las 6 descargas autorizadas
-- (4 asociadas a la versión de show por defecto, 2 globales para prensa)
INSERT INTO public.downloads (titulo, categoria, pdf_url, imagen_url, orden, layout_id)
VALUES
  (
    'Rider Técnico Completo 2026', 
    'Rider', 
    '/assets/downloads/rider_tecnico_banda_bruna.pdf', 
    NULL, 
    1, 
    '77777777-7777-7777-7777-777777777777'
  ),
  (
    'Input List & Audio Patch PDF', 
    'Audio', 
    '/assets/downloads/input_list_banda_bruna.pdf', 
    NULL, 
    2, 
    '77777777-7777-7777-7777-777777777777'
  ),
  (
    'Planta de Luces e Iluminación Oficial', 
    'Iluminacion', 
    '/assets/downloads/planta_luces_banda_bruna.pdf', 
    NULL, 
    3, 
    '77777777-7777-7777-7777-777777777777'
  ),
  (
    'Stage Plot & Distribución en PDF', 
    'Stage Plot', 
    '/assets/downloads/stage_plot_banda_bruna.pdf', 
    NULL, 
    4, 
    '77777777-7777-7777-7777-777777777777'
  ),
  (
    'Logos Oficiales (Vectores y PNG)', 
    'Logos', 
    '/assets/downloads/logos.zip', 
    NULL, 
    5, 
    NULL
  ),
  (
    'Sesión Fotográfica Prensa HD', 
    'Fotos', 
    '/assets/downloads/fotos_prensa.zip', 
    NULL, 
    6, 
    NULL
  );

-- Verificar que se hayan insertado exactamente 6 filas
SELECT count(*), titulo FROM public.downloads GROUP BY titulo;
