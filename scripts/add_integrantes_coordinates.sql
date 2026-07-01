-- =====================================================================
-- MIGRACIÓN: AGREGAR COORDENADAS PARA STAGE PLOT DINÁMICO
-- =====================================================================
-- Ejecuta este script en el editor SQL de Supabase para añadir soporte 
-- a la posición de los integrantes en el escenario.
-- =====================================================================

-- 1. Agregar columnas de coordenadas X e Y si no existen
ALTER TABLE public.integrantes ADD COLUMN IF NOT EXISTS posicion_x NUMERIC DEFAULT 50;
ALTER TABLE public.integrantes ADD COLUMN IF NOT EXISTS posicion_y NUMERIC DEFAULT 20;

-- 2. Actualizar las posiciones por defecto de la alineación oficial
-- César Bruna (Voz principal)
UPDATE public.integrantes 
SET posicion_x = 50.00, posicion_y = 20.00
WHERE id = 'e93b662d-0d60-482a-93a2-3289d40e4bcd';

-- Fabián Garrido (Guiro/Animación)
UPDATE public.integrantes 
SET posicion_x = 15.00, posicion_y = 20.00
WHERE id = '88cb89e2-6dbb-4acd-b03f-6dd055e71451';

-- Vicente Núñez (Guitarra Electrica/Dirección/Coros)
UPDATE public.integrantes 
SET posicion_x = 32.00, posicion_y = 20.00
WHERE id = 'fa455392-977e-4db7-97ba-16a6ec19deee';

-- Gerson Ulloa (Bajos/Coros)
UPDATE public.integrantes 
SET posicion_x = 85.00, posicion_y = 20.00
WHERE id = '60d53caf-c8f0-4200-b8b3-e1e74148c1aa';

-- Jaime Cárdenas Quilodrán (Percusión/Timbal/Talkback/Voces)
UPDATE public.integrantes 
SET posicion_x = 25.00, posicion_y = 70.00
WHERE id = '2aadc32a-75b4-41e8-9d29-c00aaf0d393c';

-- Jaime Cárdenas Sanhueza (Congas/Bongos/Percusión/Coros)
UPDATE public.integrantes 
SET posicion_x = 75.00, posicion_y = 70.00
WHERE id = 'aa254499-591e-49d1-96fb-33d08a31c024';

-- Israel Lagos Rocha (Pianos/Teclados/Sintetizadores)
UPDATE public.integrantes 
SET posicion_x = 68.00, posicion_y = 20.00
WHERE id = '26914340-83f7-4874-a692-8806234ece3d';

-- Verificar
SELECT nombre, cargo, posicion_x, posicion_y FROM public.integrantes ORDER BY orden ASC;
