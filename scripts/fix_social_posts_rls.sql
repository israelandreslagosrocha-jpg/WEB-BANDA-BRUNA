-- ============================================================================
-- SCRIPT DE PERMISOS RLS: SINCRONIZACIÓN AUTOMÁTICA DE REDES SOCIALES
-- Proyecto: Banda Bruna
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- 1. Permitir que el proceso de sincronización inserte y actualice publicaciones en social_posts
DROP POLICY IF EXISTS "social_posts_sync_allow" ON public.social_posts;
CREATE POLICY "social_posts_sync_allow" ON public.social_posts 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 2. Permitir actualizar seguidores en social_accounts
DROP POLICY IF EXISTS "social_accounts_sync_allow" ON public.social_accounts;
CREATE POLICY "social_accounts_sync_allow" ON public.social_accounts 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 3. Permitir guardar registros en la bitácora logs_actividad
DROP POLICY IF EXISTS "logs_actividad_sync_allow" ON public.logs_actividad;
CREATE POLICY "logs_actividad_sync_allow" ON public.logs_actividad 
  FOR INSERT 
  WITH CHECK (true);
