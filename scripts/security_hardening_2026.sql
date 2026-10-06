-- BANDA BRUNA — ENDURECIMIENTO DE SEGURIDAD 2026
-- Ejecutar UNA VEZ en Supabase Dashboard > SQL Editor, inmediatamente después
-- de desplegar el código con los secretos de servidor ya configurados.
-- El cron y las rutas administrativas ahora usan SUPABASE_SERVICE_ROLE_KEY en el servidor,
-- por lo que ninguna política amplia es necesaria para la sincronización automática.

BEGIN;

-- 1. Eliminar políticas de sincronización que daban acceso total a anon y authenticated.
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_scrape_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lanzamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_actividad ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_posts_sync_allow" ON public.social_posts;
DROP POLICY IF EXISTS "social_accounts_sync_allow" ON public.social_accounts;
DROP POLICY IF EXISTS "lanzamientos_sync_stats_allow" ON public.lanzamientos;
DROP POLICY IF EXISTS "configuracion_sync_stats_allow" ON public.configuracion;
DROP POLICY IF EXISTS "logs_actividad_sync_allow" ON public.logs_actividad;

-- Explicitar el acceso administrativo y limitar la lectura pública a datos publicados.
DROP POLICY IF EXISTS "social_accounts_read_public" ON public.social_accounts;
DROP POLICY IF EXISTS "social_accounts_admin_full" ON public.social_accounts;
CREATE POLICY "social_accounts_admin_full" ON public.social_accounts
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

DROP POLICY IF EXISTS "social_posts_admin_full" ON public.social_posts;
CREATE POLICY "social_posts_admin_full" ON public.social_posts
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

DROP POLICY IF EXISTS "social_posts_read_approved" ON public.social_posts;
CREATE POLICY "social_posts_read_approved" ON public.social_posts
  FOR SELECT TO anon, authenticated
  USING (show_on_web = true AND disponible = true);

DROP POLICY IF EXISTS "social_scrape_logs_admin_read" ON public.social_scrape_logs;
DROP POLICY IF EXISTS "social_scrape_logs_admin_full" ON public.social_scrape_logs;
CREATE POLICY "social_scrape_logs_admin_full" ON public.social_scrape_logs
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

DROP POLICY IF EXISTS "Administrador lanzamientos completo" ON public.lanzamientos;
CREATE POLICY "Administrador lanzamientos completo" ON public.lanzamientos
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

DROP POLICY IF EXISTS "Administrador configuracion completo" ON public.configuracion;
CREATE POLICY "Administrador configuracion completo" ON public.configuracion
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

DROP POLICY IF EXISTS "Administrador logs completo" ON public.logs_actividad;
CREATE POLICY "Administrador logs completo" ON public.logs_actividad
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- 2. Comentarios y testimonios: solo insertar pendientes, con límites anti-abuso.
ALTER TABLE public.testimonios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios_lanzamientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inserción pública de testimonios" ON public.testimonios;
DROP POLICY IF EXISTS "Inserción pública de testimonios pendientes" ON public.testimonios;
DROP POLICY IF EXISTS "Lectura pública de testimonios aprobados" ON public.testimonios;
DROP POLICY IF EXISTS "Administrador testimonios completo" ON public.testimonios;

CREATE POLICY "Lectura pública de testimonios aprobados" ON public.testimonios
  FOR SELECT TO anon, authenticated USING (aprobado = true);
CREATE POLICY "Inserción pública de testimonios pendientes" ON public.testimonios
  FOR INSERT TO anon
  WITH CHECK (
    aprobado = false
    AND char_length(trim(nombre_cliente)) BETWEEN 2 AND 80
    AND char_length(trim(contenido)) BETWEEN 10 AND 1200
    AND (cargo_cliente IS NULL OR char_length(trim(cargo_cliente)) <= 100)
    AND (organizacion_cliente IS NULL OR char_length(trim(organizacion_cliente)) <= 140)
    AND calificacion BETWEEN 1 AND 5
  );
CREATE POLICY "Administrador testimonios completo" ON public.testimonios
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

DROP POLICY IF EXISTS "Inserción pública de comentarios" ON public.comentarios_lanzamientos;
DROP POLICY IF EXISTS "insert_comentarios_public" ON public.comentarios_lanzamientos;
DROP POLICY IF EXISTS "Lectura pública de comentarios aprobados" ON public.comentarios_lanzamientos;
DROP POLICY IF EXISTS "Inserción pública de comentarios pendientes" ON public.comentarios_lanzamientos;
DROP POLICY IF EXISTS "Administrador comentarios completo" ON public.comentarios_lanzamientos;

-- Las rutas server-side devuelven solo comentarios aprobados y reciben las
-- opiniones pendientes. No exponer la tabla por REST a visitantes anónimos.
CREATE POLICY "Administrador comentarios completo" ON public.comentarios_lanzamientos
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- Las restricciones se aplican desde ahora sin bloquear por filas históricas.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'testimonios_public_content_limits') THEN
    ALTER TABLE public.testimonios
      ADD CONSTRAINT testimonios_public_content_limits
      CHECK (
        char_length(trim(nombre_cliente)) BETWEEN 2 AND 80
        AND char_length(trim(contenido)) BETWEEN 10 AND 1200
        AND (cargo_cliente IS NULL OR char_length(trim(cargo_cliente)) <= 100)
        AND (organizacion_cliente IS NULL OR char_length(trim(organizacion_cliente)) <= 140)
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comentarios_public_content_limits') THEN
    ALTER TABLE public.comentarios_lanzamientos
      ADD CONSTRAINT comentarios_public_content_limits
      CHECK (
        char_length(trim(nombre)) BETWEEN 2 AND 80
        AND char_length(trim(comentario)) BETWEEN 3 AND 600
        AND (ciudad IS NULL OR char_length(trim(ciudad)) <= 80)
        AND char_length(trim(lanzamiento_slug)) BETWEEN 1 AND 120
      ) NOT VALID;
  END IF;
END $$;

COMMIT;
