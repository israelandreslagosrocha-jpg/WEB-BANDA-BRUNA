-- SCRIPT PARA CREAR LAS TABLAS DE PRODUCCIÓN TÉCNICA - BANDA BRUNA
-- Ejecutar en el editor SQL de Supabase para inicializar la base de datos.

-- 1. Tabla de Versiones / Layouts de Escenario
CREATE TABLE IF NOT EXISTS public.stage_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL, 
  slug TEXT NOT NULL UNIQUE, 
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en layouts
ALTER TABLE public.stage_layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública de stage_layouts" ON public.stage_layouts FOR SELECT USING (true);
CREATE POLICY "Admin completo stage_layouts" ON public.stage_layouts FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- 2. Tabla de Estructura / Puentes (Trusses)
CREATE TABLE IF NOT EXISTS public.lighting_trusses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL, 
  descripcion TEXT,
  longitud NUMERIC NOT NULL DEFAULT 9.0, 
  altura NUMERIC NOT NULL DEFAULT 5.0, 
  carga_maxima NUMERIC NOT NULL DEFAULT 500.0, 
  orden INTEGER NOT NULL DEFAULT 0,
  layout_id UUID NOT NULL REFERENCES public.stage_layouts(id) ON DELETE CASCADE,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lighting_trusses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública de lighting_trusses" ON public.lighting_trusses FOR SELECT USING (true);
CREATE POLICY "Admin completo lighting_trusses" ON public.lighting_trusses FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- 3. Tabla Catálogo de Equipos de Iluminación (Fixtures)
CREATE TABLE IF NOT EXISTS public.lighting_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL, 
  tipo TEXT NOT NULL, -- Beam, Wash, Blinder, Led Bar, Cob, Moving Head
  marca TEXT,
  modelo TEXT,
  potencia TEXT, 
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lighting_fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública de lighting_fixtures" ON public.lighting_fixtures FOR SELECT USING (true);
CREATE POLICY "Admin completo lighting_fixtures" ON public.lighting_fixtures FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- 4. Instancias de Luminarias en el Escenario (Posicionamiento y DMX)
CREATE TABLE IF NOT EXISTS public.layout_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES public.stage_layouts(id) ON DELETE CASCADE,
  fixture_id UUID NOT NULL REFERENCES public.lighting_fixtures(id) ON DELETE CASCADE,
  truss_id UUID REFERENCES public.lighting_trusses(id) ON DELETE CASCADE, 
  nombre_etiqueta TEXT NOT NULL, 
  universo_dmx INTEGER NOT NULL DEFAULT 1,
  canal_dmx INTEGER NOT NULL DEFAULT 1,
  modo TEXT, 
  posicion_x NUMERIC NOT NULL DEFAULT 50, -- 0-100%
  posicion_y NUMERIC NOT NULL DEFAULT 50, -- 0-100%
  posicion_z NUMERIC NOT NULL DEFAULT 0, -- altura en metros
  rotacion NUMERIC NOT NULL DEFAULT 0, -- grados
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.layout_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública de layout_objects" ON public.layout_objects FOR SELECT USING (true);
CREATE POLICY "Admin completo layout_objects" ON public.layout_objects FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- 5. Efectos Especiales en el Escenario
CREATE TABLE IF NOT EXISTS public.lighting_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES public.stage_layouts(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL, 
  descripcion TEXT,
  posicion_x NUMERIC NOT NULL DEFAULT 50, 
  posicion_y NUMERIC NOT NULL DEFAULT 50, 
  cantidad INTEGER NOT NULL DEFAULT 1,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lighting_effects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública de lighting_effects" ON public.lighting_effects FOR SELECT USING (true);
CREATE POLICY "Admin completo lighting_effects" ON public.lighting_effects FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- 6. Descargas de Riders y Material Técnico
CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL, 
  categoria TEXT NOT NULL, -- Rider, Audio, Iluminacion, Backline, Stage Plot, Logos, Fotos
  pdf_url TEXT,
  imagen_url TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE, 
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública de downloads" ON public.downloads FOR SELECT USING (true);
CREATE POLICY "Admin completo downloads" ON public.downloads FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- 7. Agregar columna layout_id en tablas de rider técnico existentes
ALTER TABLE IF EXISTS public.rider_canales ADD COLUMN IF NOT EXISTS layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.rider_monitores ADD COLUMN IF NOT EXISTS layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.rider_requerimientos ADD COLUMN IF NOT EXISTS layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.rider_stageplot ADD COLUMN IF NOT EXISTS layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE;


-- =========================================================================
-- DATOS SEMILLA (Basado en la ficha oficial técnica provista)
-- =========================================================================

-- A. Crear el layout por defecto "Festival / Planta Oficial 2026"
INSERT INTO public.stage_layouts (id, nombre, slug, activo)
VALUES ('77777777-7777-7777-7777-777777777777', 'Festival / Planta Oficial 2026', 'festival-oficial-2026', true)
ON CONFLICT (slug) DO UPDATE SET nombre = EXCLUDED.nombre;

-- B. Crear los puentes (Trusses) de 9 metros
INSERT INTO public.lighting_trusses (id, nombre, descripcion, longitud, altura, carga_maxima, orden, layout_id)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Puente Contra', 'Puente trasero suspendido a 5m de altura', 9.0, 5.0, 500.0, 1, '77777777-7777-7777-7777-777777777777'),
  ('22222222-2222-2222-2222-222222222222', 'Puente Cenital', 'Puente central suspendido a 5m de altura', 9.0, 5.0, 500.0, 2, '77777777-7777-7777-7777-777777777777'),
  ('33333333-3333-3333-3333-333333333333', 'Puente Frontal', 'Puente delantero suspendido a 5m de altura', 9.0, 5.0, 500.0, 3, '77777777-7777-7777-7777-777777777777')
ON CONFLICT (id) DO NOTHING;

-- C. Insertar Focos en el Catálogo (Fixtures)
INSERT INTO public.lighting_fixtures (id, nombre, tipo, marca, modelo, potencia)
VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Beam 7R', 'Beam', 'Clay Paky', 'Sharpy 7R', '230W'),
  ('f2222222-2222-2222-2222-222222222222', 'Wash 19x15', 'Wash', 'Martin', 'MAC Aura', '300W'),
  ('f3333333-3333-3333-3333-333333333333', 'Paleta Led RGB', 'Led Bar', 'Chauvet', 'COLORband', '150W'),
  ('f4444444-4444-4444-4444-444444444444', 'COB 200W', 'Cob', 'Generic', 'COB LED 200', '200W'),
  ('f5555555-5555-5555-5555-555555555555', 'Blinder 4x100W', 'Blinder', 'Generic', 'Blinder 4 Canales', '400W')
ON CONFLICT (id) DO NOTHING;

-- D. Posicionar Luminarias (Layout Objects) para "Festival 2026"
-- Distribución simplificada de los focos en puentes (siguiendo los diagramas)

-- Puente Contra (id: 11111111-1111-...)
-- Contiene: 8 Beams (rojos), 8 Paletas LED (verdes) en Contra
INSERT INTO public.layout_objects (layout_id, fixture_id, truss_id, nombre_etiqueta, universo_dmx, canal_dmx, modo, posicion_x, posicion_y, posicion_z, rotacion)
VALUES
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Beam 1', 1, 1, '16CH', 10, 90, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Beam 2', 1, 17, '16CH', 22, 90, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Beam 3', 1, 33, '16CH', 34, 90, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Beam 4', 1, 49, '16CH', 46, 90, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Beam 5', 1, 65, '16CH', 58, 90, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Beam 6', 1, 81, '16CH', 70, 90, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Beam 7', 1, 97, '16CH', 82, 90, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Beam 8', 1, 113, '16CH', 94, 90, 5, 180),
  
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Led Contra 1', 1, 129, '4CH', 15, 90, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Led Contra 2', 1, 133, '4CH', 38, 90, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Led Contra 3', 1, 137, '4CH', 62, 90, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Led Contra 4', 1, 141, '4CH', 85, 90, 4.8, 180);

-- Puente Cenital (id: 22222222-2222-...)
-- Contiene: 8 Wash (azules), 8 Paletas LED (verdes) en Cenital
INSERT INTO public.layout_objects (layout_id, fixture_id, truss_id, nombre_etiqueta, universo_dmx, canal_dmx, modo, posicion_x, posicion_y, posicion_z, rotacion)
VALUES
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Wash 1', 1, 145, '15CH', 12, 50, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Wash 2', 1, 160, '15CH', 24, 50, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Wash 3', 1, 175, '15CH', 36, 50, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Wash 4', 1, 190, '15CH', 48, 50, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Wash 5', 1, 205, '15CH', 60, 50, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Wash 6', 1, 220, '15CH', 72, 50, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Wash 7', 1, 235, '15CH', 84, 50, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Wash 8', 1, 250, '15CH', 96, 50, 5, 180),
  
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Led Cenital 1', 1, 265, '4CH', 18, 50, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Led Cenital 2', 1, 269, '4CH', 40, 50, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Led Cenital 3', 1, 273, '4CH', 62, 50, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Led Cenital 4', 1, 277, '4CH', 82, 50, 4.8, 180);

-- Puente Frontal (id: 33333333-3333-...)
-- Contiene: 6 Blinders (naranjas), 8 COBs (amarillos)
INSERT INTO public.layout_objects (layout_id, fixture_id, truss_id, nombre_etiqueta, universo_dmx, canal_dmx, modo, posicion_x, posicion_y, posicion_z, rotacion)
VALUES
  ('77777777-7777-7777-7777-777777777777', 'f5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Blinder 1', 1, 281, '4CH', 15, 10, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Blinder 2', 1, 285, '4CH', 29, 10, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Blinder 3', 1, 289, '4CH', 43, 10, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Blinder 4', 1, 293, '4CH', 57, 10, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Blinder 5', 1, 297, '4CH', 71, 10, 5, 180),
  ('77777777-7777-7777-7777-777777777777', 'f5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Blinder 6', 1, 301, '4CH', 85, 10, 5, 180),

  ('77777777-7777-7777-7777-777777777777', 'f4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'COB 1', 1, 305, '2CH', 10, 10, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'COB 2', 1, 307, '2CH', 22, 10, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'COB 3', 1, 309, '2CH', 34, 10, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'COB 4', 1, 311, '2CH', 46, 10, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'COB 5', 1, 313, '2CH', 58, 10, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'COB 6', 1, 315, '2CH', 70, 10, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'COB 7', 1, 317, '2CH', 82, 10, 4.8, 180),
  ('77777777-7777-7777-7777-777777777777', 'f4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'COB 8', 1, 319, '2CH', 94, 10, 4.8, 180);

-- Focos en el piso (sin truss_id, con posicion_z = 0)
INSERT INTO public.layout_objects (layout_id, fixture_id, truss_id, nombre_etiqueta, universo_dmx, canal_dmx, modo, posicion_x, posicion_y, posicion_z, rotacion)
VALUES
  -- 14 Beams restantes en el piso (para hacer los 22 Beams en total)
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 1', 1, 321, '16CH', 8, 85, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 2', 1, 337, '16CH', 22, 85, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 3', 1, 353, '16CH', 36, 85, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 4', 1, 369, '16CH', 50, 85, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 5', 1, 385, '16CH', 64, 85, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 6', 1, 401, '16CH', 78, 85, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 7', 1, 417, '16CH', 92, 85, 0, 0),

  -- 8 Wash restantes en el piso/tarimas (para hacer los 16 Wash en total, de color azul)
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', NULL, 'Wash Piso L1', 1, 433, '15CH', 5, 45, 0, 45),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', NULL, 'Wash Piso L2', 1, 448, '15CH', 15, 30, 0, 45),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', NULL, 'Wash Piso R1', 1, 463, '15CH', 95, 45, 0, 315),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', NULL, 'Wash Piso R2', 1, 478, '15CH', 85, 30, 0, 315),
  
  -- 8 Paletas LED en piso (para hacer los 16 en total, color verde)
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', NULL, 'Led Piso 1', 1, 493, '4CH', 25, 80, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', NULL, 'Led Piso 2', 1, 497, '4CH', 75, 80, 0, 0);

-- E. Insertar Efectos Especiales (`lighting_effects`)
INSERT INTO public.lighting_effects (layout_id, nombre, descripcion, posicion_x, posicion_y, cantidad)
VALUES
  ('77777777-7777-7777-7777-777777777777', 'Spark', 'Máquina de chispa fría en boca de escenario', 15, 5, 1),
  ('77777777-7777-7777-7777-777777777777', 'Spark', 'Máquina de chispa fría en boca de escenario', 35, 5, 1),
  ('77777777-7777-7777-7777-777777777777', 'Spark', 'Máquina de chispa fría en boca de escenario', 65, 5, 1),
  ('77777777-7777-7777-7777-777777777777', 'Spark', 'Máquina de chispa fría en boca de escenario', 85, 5, 1),
  
  ('77777777-7777-7777-7777-777777777777', 'Smoke', 'Máquina de humo vertical en tarimas traseras', 20, 75, 1),
  ('77777777-7777-7777-7777-777777777777', 'Smoke', 'Máquina de humo vertical en tarimas traseras', 40, 75, 1),
  ('77777777-7777-7777-7777-777777777777', 'Smoke', 'Máquina de humo vertical en tarimas traseras', 60, 75, 1),
  ('77777777-7777-7777-7777-777777777777', 'Smoke', 'Máquina de humo vertical en tarimas traseras', 80, 75, 1),
  
  ('77777777-7777-7777-7777-777777777777', 'Hazer', 'Máquina de humo Hazer posicionada en el centro trasero del escenario', 50, 95, 1)
ON CONFLICT (id) DO NOTHING;

-- F. Crear Descargas por Defecto (`downloads`)
INSERT INTO public.downloads (titulo, categoria, pdf_url, imagen_url, orden, layout_id)
VALUES
  ('Rider Técnico Completo 2026', 'Rider', '/assets/downloads/rider_tecnico_banda_bruna.pdf', NULL, 1, '77777777-7777-7777-7777-777777777777'),
  ('Input List & Audio Patch PDF', 'Audio', '/assets/downloads/input_list_banda_bruna.pdf', NULL, 2, '77777777-7777-7777-7777-777777777777'),
  ('Planta de Luces e Iluminación Oficial', 'Iluminacion', '/assets/downloads/planta_luces_banda_bruna.pdf', NULL, 3, '77777777-7777-7777-7777-777777777777'),
  ('Stage Plot & Distribución en PDF', 'Stage Plot', '/assets/downloads/stage_plot_banda_bruna.pdf', NULL, 4, '77777777-7777-7777-7777-777777777777'),
  ('Logos Oficiales (Vectores y PNG)', 'Logos', '/assets/downloads/logos.zip', NULL, 5, NULL),
  ('Sesión Fotográfica Prensa HD', 'Fotos', '/assets/downloads/fotos_prensa.zip', NULL, 6, NULL)
ON CONFLICT (id) DO NOTHING;
