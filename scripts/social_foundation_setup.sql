-- ============================================================================
-- MIGRACIÓN P0 (REVISADA): FUNDACIÓN DE DATOS SOCIALES Y SEGURIDAD ESTRICTA
-- Proyecto: Banda Bruna
-- Sintaxis 100% compatible con Supabase SQL Editor
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLA: social_accounts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id VARCHAR(30) PRIMARY KEY,
  platform VARCHAR(20) NOT NULL,
  username VARCHAR(100) NOT NULL,
  profile_url TEXT NOT NULL,
  followers_count INT DEFAULT 0,
  followers_label VARCHAR(50) NOT NULL,
  method VARCHAR(30) NOT NULL,
  last_scraped_at TIMESTAMPTZ,
  last_status VARCHAR(20) DEFAULT 'pending' CHECK (last_status IN ('pending', 'ok', 'error')),
  last_error_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. TABLA: social_posts (Modelo Lean de 2 Estados: disponible y show_on_web)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok', 'facebook')),
  external_id VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  post_type VARCHAR(20) DEFAULT 'post' CHECK (post_type IN ('video', 'short', 'reel', 'post', 'photo')),
  title TEXT,
  caption TEXT,
  thumbnail_url TEXT,
  thumbnail_is_ephemeral BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  likes INT DEFAULT 0,
  views INT DEFAULT 0,
  comments INT DEFAULT 0,
  disponible BOOLEAN DEFAULT true,
  show_on_web BOOLEAN DEFAULT false,
  web_order INT DEFAULT NULL,
  consecutive_404_count INT DEFAULT 0,
  last_scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_social_posts_platform_external UNIQUE (platform, external_id)
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: social_scrape_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type VARCHAR(30) NOT NULL CHECK (run_type IN ('followers', 'feed_discovery', 'metrics_refresh')),
  platform VARCHAR(20) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'warning', 'failed')),
  items_detected INT DEFAULT 0,
  items_updated INT DEFAULT 0,
  error_type VARCHAR(50) DEFAULT 'none' CHECK (error_type IN ('none', 'http_404', 'waf_challenge', 'login_wall', 'timeout', 'rate_limit', 'scrapfly_error', 'network_error')),
  error_details TEXT
);

-- ----------------------------------------------------------------------------
-- 4. ÍNDICES DE ALTO RENDIMIENTO
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_social_posts_frontend ON public.social_posts(show_on_web, disponible, web_order, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_dashboard ON public.social_posts(platform, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_scrape_logs_started ON public.social_scrape_logs(started_at DESC);

-- ----------------------------------------------------------------------------
-- 5. TRIGGERS Y FUNCIONES CON SEARCH_PATH EXPLÍCITO
-- ----------------------------------------------------------------------------

-- 5.1 Trigger: Proteger show_on_web y web_order de mutaciones no autorizadas
CREATE OR REPLACE FUNCTION public.protect_admin_social_post_fields()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (auth.role() IS NULL OR auth.role() != 'authenticated') THEN
      NEW.show_on_web := OLD.show_on_web;
      NEW.web_order := OLD.web_order;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_admin_social_post_fields ON public.social_posts;
CREATE TRIGGER trg_protect_admin_social_post_fields
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_social_post_fields();

-- 5.2 Trigger: Disponibilidad ante 404s reales vs transitorios
CREATE OR REPLACE FUNCTION public.check_social_post_availability()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.consecutive_404_count >= 3 THEN
    NEW.disponible := false;
  ELSIF NEW.consecutive_404_count = 0 THEN
    NEW.disponible := true;
  ELSE
    IF TG_OP = 'UPDATE' THEN
      NEW.disponible := OLD.disponible;
    ELSE
      NEW.disponible := true;
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_social_post_availability ON public.social_posts;
CREATE TRIGGER trg_check_social_post_availability
  BEFORE INSERT OR UPDATE ON public.social_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_social_post_availability();

-- 5.3 Stored Procedure Idempotente para el Worker Server-Side
CREATE OR REPLACE FUNCTION public.upsert_scraped_social_post(
  p_platform VARCHAR,
  p_external_id VARCHAR,
  p_url TEXT,
  p_post_type VARCHAR,
  p_title TEXT,
  p_caption TEXT,
  p_thumbnail_url TEXT,
  p_thumbnail_is_ephemeral BOOLEAN,
  p_published_at TIMESTAMPTZ,
  p_likes INT,
  p_views INT,
  p_comments INT
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.social_posts (
    platform,
    external_id,
    url,
    post_type,
    title,
    caption,
    thumbnail_url,
    thumbnail_is_ephemeral,
    published_at,
    likes,
    views,
    comments,
    disponible,
    show_on_web,
    web_order,
    consecutive_404_count,
    last_scraped_at
  ) VALUES (
    p_platform,
    p_external_id,
    p_url,
    p_post_type,
    p_title,
    p_caption,
    p_thumbnail_url,
    p_thumbnail_is_ephemeral,
    p_published_at,
    p_likes,
    p_views,
    p_comments,
    true,
    false,
    NULL,
    0,
    NOW()
  )
  ON CONFLICT (platform, external_id) DO UPDATE SET
    title = EXCLUDED.title,
    caption = EXCLUDED.caption,
    thumbnail_url = EXCLUDED.thumbnail_url,
    thumbnail_is_ephemeral = EXCLUDED.thumbnail_is_ephemeral,
    likes = EXCLUDED.likes,
    views = EXCLUDED.views,
    comments = EXCLUDED.comments,
    consecutive_404_count = 0,
    disponible = true,
    last_scraped_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. PERMISOS PRIVILEGIADOS DEL STORED PROCEDURE
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.upsert_scraped_social_post(VARCHAR, VARCHAR, TEXT, VARCHAR, TEXT, TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, INT, INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_scraped_social_post(VARCHAR, VARCHAR, TEXT, VARCHAR, TEXT, TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, INT, INT, INT) FROM anon;
REVOKE ALL ON FUNCTION public.upsert_scraped_social_post(VARCHAR, VARCHAR, TEXT, VARCHAR, TEXT, TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, INT, INT, INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_scraped_social_post(VARCHAR, VARCHAR, TEXT, VARCHAR, TEXT, TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, INT, INT, INT) TO service_role;

-- ----------------------------------------------------------------------------
-- 7. VISTA PÚBLICA PARA SSR (MÍNIMO PRIVILEGIO: OCULTA METADATA OPERACIONAL)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.social_accounts_public AS
  SELECT id, platform, username, profile_url, followers_count, followers_label
  FROM public.social_accounts;

GRANT SELECT ON public.social_accounts_public TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS)
-- Sintaxis probada: FOR ALL USING (...) y FOR SELECT USING (...)
-- ----------------------------------------------------------------------------
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_scrape_logs ENABLE ROW LEVEL SECURITY;

-- 8.1 Políticas social_accounts
DROP POLICY IF EXISTS "social_accounts_read_public" ON public.social_accounts;
CREATE POLICY "social_accounts_read_public" ON public.social_accounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "social_accounts_admin_full" ON public.social_accounts;
CREATE POLICY "social_accounts_admin_full" ON public.social_accounts FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- 8.2 Políticas social_posts
DROP POLICY IF EXISTS "social_posts_read_approved" ON public.social_posts;
CREATE POLICY "social_posts_read_approved" ON public.social_posts FOR SELECT USING (show_on_web = true AND disponible = true);

DROP POLICY IF EXISTS "social_posts_admin_full" ON public.social_posts;
CREATE POLICY "social_posts_admin_full" ON public.social_posts FOR ALL USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- 8.3 Políticas social_scrape_logs (Solo visible para el admin)
DROP POLICY IF EXISTS "social_scrape_logs_admin_read" ON public.social_scrape_logs;
CREATE POLICY "social_scrape_logs_admin_read" ON public.social_scrape_logs FOR SELECT USING (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- ----------------------------------------------------------------------------
-- 9. PERMISOS COMPLETOS PARA SERVICE_ROLE (WORKER SERVER-SIDE)
-- ----------------------------------------------------------------------------
GRANT ALL ON public.social_accounts TO service_role;
GRANT ALL ON public.social_posts TO service_role;
GRANT ALL ON public.social_scrape_logs TO service_role;

-- ----------------------------------------------------------------------------
-- 10. SEED DATA INICIAL
-- ----------------------------------------------------------------------------
INSERT INTO public.social_accounts (id, platform, username, profile_url, followers_count, followers_label, method, last_status)
VALUES
  ('youtube', 'youtube', '@bandabrunaoficial', 'https://www.youtube.com/@bandabrunaoficial', 911, 'suscriptores', 'http_direct', 'ok'),
  ('instagram', 'instagram', '@banda_bruna', 'https://www.instagram.com/banda_bruna/', 3360, 'seguidores', 'http_direct', 'ok'),
  ('tiktok', 'tiktok', '@bandabrunaoficial', 'https://www.tiktok.com/@bandabrunaoficial', 1095, 'seguidores', 'scrapfly', 'pending'),
  ('facebook', 'facebook', 'bandabruna', 'https://www.facebook.com/bandabruna', 4971, 'seguidores de página', 'scrapfly', 'pending')
ON CONFLICT (id) DO UPDATE SET
  followers_label = EXCLUDED.followers_label,
  method = EXCLUDED.method;
