-- BANDA BRUNA — REMEDIACIÓN SECURITY ADVISOR (2026-10-06)
--
-- Ejecutar DESPUÉS de desplegar el código de esta misma corrección.
-- El despliegue mueve formularios y lecturas públicas a rutas server-side; por
-- eso, al aplicar este script ya no se necesita acceso anónimo directo a las
-- tablas protegidas. Es idempotente para los nombres de políticas conocidos.

BEGIN;

-- 1. Formularios públicos: solo el servidor escribe mediante service_role.
--    Los administradores autenticados conservan su acceso, sujeto a RLS.
ALTER TABLE public.comentarios_lanzamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_comentarios_public" ON public.comentarios_lanzamientos;
DROP POLICY IF EXISTS "Inserción pública de comentarios" ON public.comentarios_lanzamientos;
DROP POLICY IF EXISTS "Inserción pública de comentarios pendientes" ON public.comentarios_lanzamientos;
DROP POLICY IF EXISTS "Lectura pública de comentarios aprobados" ON public.comentarios_lanzamientos;
DROP POLICY IF EXISTS "Administrador comentarios completo" ON public.comentarios_lanzamientos;

CREATE POLICY "Administrador comentarios completo" ON public.comentarios_lanzamientos
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

DROP POLICY IF EXISTS "Inserción pública de contactos" ON public.contactos;
DROP POLICY IF EXISTS "Administrador contactos completo" ON public.contactos;
CREATE POLICY "Administrador contactos completo" ON public.contactos
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

DROP POLICY IF EXISTS "Inserción pública de cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Permitir insercion publica de cotizaciones" ON public.cotizaciones;
DROP POLICY IF EXISTS "Administrador cotizaciones completo" ON public.cotizaciones;
CREATE POLICY "Administrador cotizaciones completo" ON public.cotizaciones
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  WITH CHECK (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

REVOKE ALL ON TABLE public.comentarios_lanzamientos, public.contactos, public.cotizaciones FROM PUBLIC;
REVOKE ALL ON TABLE public.comentarios_lanzamientos, public.contactos, public.cotizaciones FROM anon;
GRANT ALL ON TABLE public.comentarios_lanzamientos, public.contactos, public.cotizaciones TO authenticated, service_role;

-- 2. Radio Monitor: no se expone ninguna tabla directamente por PostgREST.
--    Las rutas /api/radio públicas devuelven solo el subconjunto necesario;
--    monitor, dashboard y cron usan la clave de servicio en el servidor.
ALTER TABLE public.radio_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitored_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitored_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.now_playing ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.radio_providers, public.radios, public.monitored_artists,
  public.monitored_tracks, public.radio_tracks, public.now_playing FROM PUBLIC;
REVOKE ALL ON TABLE public.radio_providers, public.radios, public.monitored_artists,
  public.monitored_tracks, public.radio_tracks, public.now_playing FROM anon, authenticated;
GRANT ALL ON TABLE public.radio_providers, public.radios, public.monitored_artists,
  public.monitored_tracks, public.radio_tracks, public.now_playing TO service_role;

-- 3. La vista no requiere privilegios del creador ni acceso público directo.
ALTER VIEW public.social_accounts_public SET (security_invoker = true);
REVOKE ALL ON TABLE public.social_accounts_public FROM PUBLIC, anon, authenticated;

-- 4. Son funciones de trigger, no RPC públicas. Revocar EXECUTE no impide que
--    los triggers existentes se ejecuten durante INSERT/UPDATE autorizados.
REVOKE ALL ON FUNCTION public.check_social_post_availability() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_admin_social_post_fields() FROM PUBLIC, anon, authenticated;

COMMIT;
