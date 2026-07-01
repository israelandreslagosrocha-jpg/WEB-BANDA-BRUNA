-- =====================================================================
-- BANDA BRUNA - SQL DEFINITIVO DE ACTUALIZACIÓN & PRODUCCIÓN TÉCNICA
-- Ejecuta este script completo en el SQL Editor de tu consola de Supabase
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ACTUALIZAR LANZAMIENTO "AHOGADO EN UN BAR"
-- ---------------------------------------------------------------------
UPDATE public.lanzamientos
SET 
  fecha_lanzamiento = '2026-07-04 19:00:00-04',
  plataformas_links = jsonb_set(COALESCE(plataformas_links, '{}'::jsonb), '{youtube}', '"https://www.youtube.com/watch?v=mZhYl60ENAs"')
WHERE slug = 'ahogado-en-un-bar';


-- ---------------------------------------------------------------------
-- 2. TABLAS DEL PORTAL DE PRODUCCIÓN TÉCNICA
-- ---------------------------------------------------------------------

-- A. Versiones de Escenario (Stage Layouts)
CREATE TABLE IF NOT EXISTS public.stage_layouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar que las columnas 'descripcion' y 'slug' existen si la tabla ya existía previamente
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stage_layouts' AND column_name='descripcion') THEN
    ALTER TABLE public.stage_layouts ADD COLUMN descripcion TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stage_layouts' AND column_name='slug') THEN
    ALTER TABLE public.stage_layouts ADD COLUMN slug TEXT UNIQUE;
  END IF;
END $$;

-- B. Puentes/Estructuras Metálicas (Lighting Trusses)
CREATE TABLE IF NOT EXISTS public.lighting_trusses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  longitud NUMERIC NOT NULL, -- en metros
  altura NUMERIC NOT NULL,   -- en metros
  carga_maxima NUMERIC,      -- en kg
  orden INTEGER DEFAULT 0,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- C. Catálogo de Focos Físicos (Lighting Fixtures)
CREATE TABLE IF NOT EXISTS public.lighting_fixtures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,       -- Beam, Wash, Led Bar, Cob, Blinder, etc.
  marca TEXT,
  modelo TEXT,
  potencia TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- D. Distribución de Focos (Layout Objects)
CREATE TABLE IF NOT EXISTS public.layout_objects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE,
  fixture_id UUID REFERENCES public.lighting_fixtures(id) ON DELETE CASCADE,
  truss_id UUID REFERENCES public.lighting_trusses(id) ON DELETE SET NULL,
  nombre_etiqueta TEXT,      -- Ej: Beam 1, Wash 4
  universo_dmx INTEGER DEFAULT 1,
  canal_dmx INTEGER NOT NULL,
  modo TEXT,                 -- Ej: 16CH, 4CH
  posicion_x NUMERIC NOT NULL, -- Porcentaje horizontal (0-100)
  posicion_y NUMERIC NOT NULL, -- Porcentaje vertical (0-100)
  posicion_z NUMERIC DEFAULT 0, -- Altura en metros
  rotacion NUMERIC DEFAULT 0,   -- Grados
  created_at TIMESTAMPTZ DEFAULT now()
);

-- E. Máquinas de Efectos Especiales (Lighting Effects)
CREATE TABLE IF NOT EXISTS public.lighting_effects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,       -- Spark, Smoke, Hazer, etc.
  descripcion TEXT,
  posicion_x NUMERIC NOT NULL,
  posicion_y NUMERIC NOT NULL,
  cantidad INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- F. Descargas de Riders y Fichas (Downloads)
CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL,    -- Rider, Audio, Iluminacion, Stage Plot, etc.
  pdf_url TEXT,
  imagen_url TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ---------------------------------------------------------------------
-- 3. AJUSTE DE COLUMNA LAYOUT EN TABLAS EXISTENTES DE AUDIO & ESCENARIO
-- ---------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rider_canales' AND column_name='layout_id') THEN
    ALTER TABLE public.rider_canales ADD COLUMN layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rider_monitores' AND column_name='layout_id') THEN
    ALTER TABLE public.rider_monitores ADD COLUMN layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rider_requerimientos' AND column_name='layout_id') THEN
    ALTER TABLE public.rider_requerimientos ADD COLUMN layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rider_stageplot' AND column_name='layout_id') THEN
    ALTER TABLE public.rider_stageplot ADD COLUMN layout_id UUID REFERENCES public.stage_layouts(id) ON DELETE CASCADE;
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- 4. SEGURIDAD Y POLÍTICAS DE RLS (SÓLO CORREO OFICIAL)
-- ---------------------------------------------------------------------

-- Activar RLS en las nuevas tablas
ALTER TABLE public.stage_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lighting_trusses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lighting_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layout_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lighting_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores por si acaso
DROP POLICY IF EXISTS "Lectura pública de layouts" ON public.stage_layouts;
DROP POLICY IF EXISTS "Escritura protegida de layouts" ON public.stage_layouts;
DROP POLICY IF EXISTS "Lectura pública de trusses" ON public.lighting_trusses;
DROP POLICY IF EXISTS "Escritura protegida de trusses" ON public.lighting_trusses;
DROP POLICY IF EXISTS "Lectura pública de fixtures" ON public.lighting_fixtures;
DROP POLICY IF EXISTS "Escritura protegida de fixtures" ON public.lighting_fixtures;
DROP POLICY IF EXISTS "Lectura pública de objetos" ON public.layout_objects;
DROP POLICY IF EXISTS "Escritura protegida de objetos" ON public.layout_objects;
DROP POLICY IF EXISTS "Lectura pública de efectos" ON public.lighting_effects;
DROP POLICY IF EXISTS "Escritura protegida de efectos" ON public.lighting_effects;
DROP POLICY IF EXISTS "Lectura pública de descargas" ON public.downloads;
DROP POLICY IF EXISTS "Escritura protegida de descargas" ON public.downloads;

-- Políticas de Lectura Pública (Cualquiera puede ver la landing /produccion)
CREATE POLICY "Lectura pública de layouts" ON public.stage_layouts FOR SELECT USING (true);
CREATE POLICY "Lectura pública de trusses" ON public.lighting_trusses FOR SELECT USING (true);
CREATE POLICY "Lectura pública de fixtures" ON public.lighting_fixtures FOR SELECT USING (true);
CREATE POLICY "Lectura pública de objetos" ON public.layout_objects FOR SELECT USING (true);
CREATE POLICY "Lectura pública de efectos" ON public.lighting_effects FOR SELECT USING (true);
CREATE POLICY "Lectura pública de descargas" ON public.downloads FOR SELECT USING (true);

-- Políticas de Escritura Protegida (Sólo contacto@bandabruna.cl)
CREATE POLICY "Escritura protegida de layouts" ON public.stage_layouts 
  FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

CREATE POLICY "Escritura protegida de trusses" ON public.lighting_trusses 
  FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

CREATE POLICY "Escritura protegida de fixtures" ON public.lighting_fixtures 
  FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

CREATE POLICY "Escritura protegida de objetos" ON public.layout_objects 
  FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

CREATE POLICY "Escritura protegida de efectos" ON public.lighting_effects 
  FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

CREATE POLICY "Escritura protegida de descargas" ON public.downloads 
  FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');


-- ---------------------------------------------------------------------
-- 5. SEMILLA INICIAL DEL SHOW (FESTIVAL / PLANTA OFICIAL 2026)
-- ---------------------------------------------------------------------

-- Insertar Layout
INSERT INTO public.stage_layouts (id, nombre, slug, descripcion, activo)
VALUES ('77777777-7777-7777-7777-777777777777', 'Festival / Planta Oficial 2026', 'festival-2026', 'Configuración estándar para escenarios masivos y festivales al aire libre.', true)
ON CONFLICT (id) DO NOTHING;

-- Insertar Trusses (Puentes)
INSERT INTO public.lighting_trusses (id, layout_id, nombre, longitud, altura, carga_maxima, orden, descripcion)
VALUES
  ('11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Puente Contra (Trasero)', 9.0, 5.0, 500, 1, 'Estructura trasera para contras, siluetas y efectos aéreos.'),
  ('22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'Puente Cenital (Medio)', 9.0, 5.0, 500, 2, 'Estructura central para luz cenital sobre los músicos.'),
  ('33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'Puente Frontal (Frente)', 9.0, 5.0, 600, 3, 'Estructura delantera para iluminación de rostros (COBs) y Blinders.')
ON CONFLICT (id) DO NOTHING;

-- Insertar Catálogo de Fixtures
INSERT INTO public.lighting_fixtures (id, nombre, tipo, marca, modelo, potencia)
VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Beam 7R', 'Beam', 'Clay Paky', 'Sharpy 7R', '230W'),
  ('f2222222-2222-2222-2222-222222222222', 'Wash 19x15', 'Wash', 'Martin', 'MAC Aura', '300W'),
  ('f3333333-3333-3333-3333-333333333333', 'Paleta Led RGB', 'Led Bar', 'Chauvet', 'COLORband', '150W'),
  ('f4444444-4444-4444-4444-444444444444', 'COB 200W', 'Cob', 'Generic', 'COB LED 200', '200W'),
  ('f5555555-5555-5555-5555-555555555555', 'Blinder 4x100W', 'Blinder', 'Generic', 'Blinder 4 Canales', '400W')
ON CONFLICT (id) DO NOTHING;

-- Posicionar Focos en los Trusses
INSERT INTO public.layout_objects (layout_id, fixture_id, truss_id, nombre_etiqueta, universo_dmx, canal_dmx, modo, posicion_x, posicion_y, posicion_z, rotacion)
VALUES
  -- Puente Contra: 8 Beams (rojos), 4 Barras Led
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
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Led Contra 4', 1, 141, '4CH', 85, 90, 4.8, 180),

  -- Puente Cenital: 8 Wash (azules), 4 Barras Led
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
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Led Cenital 4', 1, 277, '4CH', 82, 50, 4.8, 180),

  -- Puente Frontal: 6 Blinders (naranjas), 8 COBs (amarillos)
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
  ('77777777-7777-7777-7777-777777777777', 'f4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'COB 8', 1, 319, '2CH', 94, 10, 4.8, 180),

  -- Focos en el piso (sin truss_id, con posicion_z = 0)
  -- 14 Beams restantes (para hacer 22 en total)
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 1', 1, 321, '16CH', 8, 85, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 2', 1, 337, '16CH', 22, 85, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 3', 1, 353, '16CH', 36, 85, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 4', 1, 369, '16CH', 50, 85, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 5', 1, 385, '16CH', 64, 85, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 6', 1, 401, '16CH', 78, 85, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f1111111-1111-1111-1111-111111111111', NULL, 'Beam Piso 7', 1, 417, '16CH', 92, 85, 0, 0),

  -- 8 Wash restantes en el piso (para hacer 16 en total, color azul)
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', NULL, 'Wash Piso L1', 1, 433, '15CH', 5, 45, 0, 45),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', NULL, 'Wash Piso L2', 1, 448, '15CH', 15, 30, 0, 45),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', NULL, 'Wash Piso R1', 1, 463, '15CH', 95, 45, 0, 315),
  ('77777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', NULL, 'Wash Piso R2', 1, 478, '15CH', 85, 30, 0, 315),

  -- 8 Paletas LED en piso (para hacer 12 en total, color verde)
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', NULL, 'Led Piso 1', 1, 493, '4CH', 25, 80, 0, 0),
  ('77777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', NULL, 'Led Piso 2', 1, 497, '4CH', 75, 80, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Insertar Efectos Especiales (FX)
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

-- Insertar Descargas por Defecto
INSERT INTO public.downloads (titulo, categoria, pdf_url, imagen_url, orden, layout_id)
VALUES
  ('Rider Técnico Completo 2026', 'Rider', '/assets/downloads/rider_tecnico_banda_bruna.pdf', NULL, 1, '77777777-7777-7777-7777-777777777777'),
  ('Input List & Audio Patch PDF', 'Audio', '/assets/downloads/input_list_banda_bruna.pdf', NULL, 2, '77777777-7777-7777-7777-777777777777'),
  ('Planta de Luces e Iluminación Oficial', 'Iluminacion', '/assets/downloads/planta_luces_banda_bruna.pdf', NULL, 3, '77777777-7777-7777-7777-777777777777'),
  ('Stage Plot & Distribución en PDF', 'Stage Plot', '/assets/downloads/stage_plot_banda_bruna.pdf', NULL, 4, '77777777-7777-7777-7777-777777777777'),
  ('Logos Oficiales (Vectores y PNG)', 'Logos', '/assets/downloads/logos.zip', NULL, 5, NULL),
  ('Sesión Fotográfica Prensa HD', 'Fotos', '/assets/downloads/fotos_prensa.zip', NULL, 6, NULL)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 6. LIMPIEZA Y REORDENAMIENTO DE LA TABLA DE CANALES EXISTENTE (SIN BRONCES)
-- ---------------------------------------------------------------------
-- Limpia los canales previos para que la semilla se inicialice sin bronces de forma correcta
DELETE FROM public.rider_canales;

INSERT INTO public.rider_canales (canal, instrumento, conexion, categoria, layout_id)
VALUES
  (1, 'KICK', 'SHURE PGA52', 'bateria', '77777777-7777-7777-7777-777777777777'),
  (2, 'SNARE', 'SHURE PGA57', 'bateria', '77777777-7777-7777-7777-777777777777'),
  (3, 'TIMBAL HIGH', 'SHURE PGA56', 'bateria', '77777777-7777-7777-7777-777777777777'),
  (4, 'TIMBAL LOW', 'SHURE PGA56', 'bateria', '77777777-7777-7777-7777-777777777777'),
  (5, 'OCTAPAD', 'CAJA DIRECTA (DI)', 'bateria', '77777777-7777-7777-7777-777777777777'),
  (6, 'OH L', 'SHURE PGA81', 'bateria', '77777777-7777-7777-7777-777777777777'),
  (7, 'OH R', 'SHURE PGA81', 'bateria', '77777777-7777-7777-7777-777777777777'),
  (8, 'CONGA HIGH', 'SHURE PGA56', 'percusion', '77777777-7777-7777-7777-777777777777'),
  (9, 'CONGA LOW', 'SHURE PGA56', 'percusion', '77777777-7777-7777-7777-777777777777'),
  (10, 'BONGOS', 'SHURE SM57', 'percusion', '77777777-7777-7777-7777-777777777777'),
  (11, 'CHIMES', 'SHURE SM57', 'percusion', '77777777-7777-7777-7777-777777777777'),
  (12, 'BASS (DI)', 'CAJA DIRECTA ACTIVA', 'cuerdas', '77777777-7777-7777-7777-777777777777'),
  (13, 'GTR ACUSTICA', 'CAJA DIRECTA', 'cuerdas', '77777777-7777-7777-7777-777777777777'),
  (14, 'GTR ELECTRICA', 'MIC (SM57 / PGA57)', 'cuerdas', '77777777-7777-7777-7777-777777777777'),
  (15, 'TECLADO L', 'CAJA DIRECTA', 'cuerdas', '77777777-7777-7777-7777-777777777777'),
  (16, 'TECLADO R', 'CAJA DIRECTA', 'cuerdas', '77777777-7777-7777-7777-777777777777'),
  (17, 'VOZ MAIN (BRUNA)', 'SHURE BETA 58 WIRELESS', 'voces', '77777777-7777-7777-7777-777777777777'),
  (18, 'VOZ CORO (GTR)', 'SHURE SM58', 'voces', '77777777-7777-7777-7777-777777777777'),
  (19, 'VOZ CORO (TECL)', 'SHURE SM58', 'voces', '77777777-7777-7777-7777-777777777777')
ON CONFLICT DO NOTHING;
