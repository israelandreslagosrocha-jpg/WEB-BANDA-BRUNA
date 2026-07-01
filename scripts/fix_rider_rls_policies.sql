-- Habilitar RLS en las tablas del Rider si no están habilitadas
ALTER TABLE IF EXISTS public.rider_stageplot ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rider_canales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rider_monitores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rider_requerimientos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen para evitar conflictos
DROP POLICY IF EXISTS "Lectura pública de rider_stageplot" ON public.rider_stageplot;
DROP POLICY IF EXISTS "Administrador completo de rider_stageplot" ON public.rider_stageplot;
DROP POLICY IF EXISTS "Lectura pública de rider_canales" ON public.rider_canales;
DROP POLICY IF EXISTS "Administrador completo de rider_canales" ON public.rider_canales;
DROP POLICY IF EXISTS "Lectura pública de rider_monitores" ON public.rider_monitores;
DROP POLICY IF EXISTS "Administrador completo de rider_monitores" ON public.rider_monitores;
DROP POLICY IF EXISTS "Lectura pública de rider_requerimientos" ON public.rider_requerimientos;
DROP POLICY IF EXISTS "Administrador completo de rider_requerimientos" ON public.rider_requerimientos;

-- Crear políticas de lectura pública para todos
CREATE POLICY "Lectura pública de rider_stageplot" ON public.rider_stageplot FOR SELECT USING (true);
CREATE POLICY "Lectura pública de rider_canales" ON public.rider_canales FOR SELECT USING (true);
CREATE POLICY "Lectura pública de rider_monitores" ON public.rider_monitores FOR SELECT USING (true);
CREATE POLICY "Lectura pública de rider_requerimientos" ON public.rider_requerimientos FOR SELECT USING (true);

-- Crear políticas de administrador completo para contacto@bandabruna.cl
CREATE POLICY "Administrador completo de rider_stageplot" ON public.rider_stageplot FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');
CREATE POLICY "Administrador completo de rider_canales" ON public.rider_canales FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');
CREATE POLICY "Administrador completo de rider_monitores" ON public.rider_monitores FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');
CREATE POLICY "Administrador completo de rider_requerimientos" ON public.rider_requerimientos FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');
