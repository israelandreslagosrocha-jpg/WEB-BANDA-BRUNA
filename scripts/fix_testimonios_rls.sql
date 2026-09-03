-- SCRIPT DE CORRECCIÓN DE SEGURIDAD RLS - TABLA TESTIMONIOS
-- Proyecto: Banda Bruna
-- Ejecutar en: Supabase Dashboard -> SQL Editor

-- 1. Eliminar la fila de prueba generada durante la auditoría
DELETE FROM public.testimonios 
WHERE nombre_cliente = 'Probe';

-- 2. Asegurar que Row Level Security (RLS) esté activo
ALTER TABLE public.testimonios ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas de inserción previas potencialmente permisivas
DROP POLICY IF EXISTS "Inserción pública de testimonios" ON public.testimonios;
DROP POLICY IF EXISTS "Inserción pública de testimonios pendientes" ON public.testimonios;

-- 4. Crear política estricta: usuarios anónimos SOLO pueden insertar testimonios con aprobado = false
CREATE POLICY "Inserción pública de testimonios pendientes" ON public.testimonios
  FOR INSERT TO anon 
  WITH CHECK (aprobado = false);

-- 5. Verificar que la política de lectura pública solo exponga testimonios aprobados
DROP POLICY IF EXISTS "Lectura pública de testimonios aprobados" ON public.testimonios;
CREATE POLICY "Lectura pública de testimonios aprobados" ON public.testimonios
  FOR SELECT TO anon 
  USING (aprobado = true);

-- 6. Verificar que la administración completa permanezca exclusiva para el correo autorizado
DROP POLICY IF EXISTS "Administrador testimonios completo" ON public.testimonios;
CREATE POLICY "Administrador testimonios completo" ON public.testimonios
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');
