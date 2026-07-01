-- =====================================================================
-- SCRIPT DE ACTUALIZACIÓN DE INTEGRANTES - BANDA BRUNA 2.0
-- =====================================================================
-- Ejecuta este script en el editor SQL de tu consola de Supabase 
-- para actualizar los nombres, cargos (roles) y el orden de los 
-- integrantes oficiales de la banda para que coincidan con la ley del
-- Stage Plot y el sitio web.
-- =====================================================================

-- 1. César Bruna (Voz principal)
UPDATE public.integrantes 
SET 
  nombre = 'Cesar Bruna', 
  cargo = 'Voz principal', 
  orden = 1 
WHERE id = 'e93b662d-0d60-482a-93a2-3289d40e4bcd';

-- 2. Fabián Garrido (Guiro/Animación)
UPDATE public.integrantes 
SET 
  nombre = 'Fabian Garrido', 
  cargo = 'Guiro/Animación', 
  orden = 2 
WHERE id = '88cb89e2-6dbb-4acd-b03f-6dd055e71451';

-- 3. Vicente Núñez (Guitarra Electrica/Dirección/Coros)
UPDATE public.integrantes 
SET 
  nombre = 'Vicente Nuñez', 
  cargo = 'Guitarra Electrica/Dirección/Coros', 
  orden = 3 
WHERE id = 'fa455392-977e-4db7-97ba-16a6ec19deee';

-- 4. Gerson Ulloa (Bajos/Coros)
UPDATE public.integrantes 
SET 
  nombre = 'Gerson Ulloa', 
  cargo = 'Bajos/Coros', 
  orden = 4 
WHERE id = '60d53caf-c8f0-4200-b8b3-e1e74148c1aa';

-- 5. Jaime Cárdenas Quilodrán (Percusión/Timbal/Talkback/Voces)
UPDATE public.integrantes 
SET 
  nombre = 'Jaime Cardenas Quilodrán', 
  cargo = 'Percusión/Timbal/Talkback/Voces', 
  orden = 5 
WHERE id = '2aadc32a-75b4-41e8-9d29-c00aaf0d393c';

-- 6. Jaime Cárdenas Sanhueza (Congas/Bongos/Percusión/Coros)
UPDATE public.integrantes 
SET 
  nombre = 'Jaime Cardenas Sanhueza', 
  cargo = 'Congas/Bongos/Percusión/Coros', 
  orden = 6 
WHERE id = 'aa254499-591e-49d1-96fb-33d08a31c024';

-- 7. Israel Lagos Rocha (Pianos/Teclados/Sintetizadores)
UPDATE public.integrantes 
SET 
  nombre = 'Israel Lagos Rocha', 
  cargo = 'Pianos/Teclados/Sintetizadores', 
  orden = 7 
WHERE id = '26914340-83f7-4874-a692-8806234ece3d';

-- Verificar resultados
SELECT nombre, cargo, orden FROM public.integrantes ORDER BY orden ASC;
