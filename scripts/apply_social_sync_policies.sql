-- ============================================================================
-- SCRIPT DE PERMISOS RLS: SINCRONIZACIÓN AUTOMÁTICA DE REDES Y MÉTRICAS
-- Proyecto: Banda Bruna
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- 1. Tabla social_posts: permitir que la sincronización inserte y actualice
DROP POLICY IF EXISTS "social_posts_sync_allow" ON public.social_posts;
CREATE POLICY "social_posts_sync_allow" ON public.social_posts 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 2. Tabla social_accounts: permitir actualización de contadores
DROP POLICY IF EXISTS "social_accounts_sync_allow" ON public.social_accounts;
CREATE POLICY "social_accounts_sync_allow" ON public.social_accounts 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 3. Tabla lanzamientos: permitir actualizar estadísticas en plataformas_links
DROP POLICY IF EXISTS "lanzamientos_sync_stats_allow" ON public.lanzamientos;
CREATE POLICY "lanzamientos_sync_stats_allow" ON public.lanzamientos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Tabla configuracion: permitir actualizar las cantidades de seguidores
DROP POLICY IF EXISTS "configuracion_sync_stats_allow" ON public.configuracion;
CREATE POLICY "configuracion_sync_stats_allow" ON public.configuracion
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 5. Tabla logs_actividad: permitir registrar logs de auditoría
DROP POLICY IF EXISTS "logs_actividad_sync_allow" ON public.logs_actividad;
CREATE POLICY "logs_actividad_sync_allow" ON public.logs_actividad 
  FOR INSERT 
  WITH CHECK (true);
