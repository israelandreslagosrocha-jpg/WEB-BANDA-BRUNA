-- BANDA BRUNA — VERIFICACIÓN SOLO LECTURA (2026-10-06)
-- Ejecutar después de security_advisor_remediation_2026_10.sql.

-- RLS y privilegios de tablas que no deben ser consultables directamente.
SELECT
  c.relname AS tabla,
  c.relrowsecurity AS rls_activo,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
  has_table_privilege('anon', c.oid, 'INSERT') AS anon_insert,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_select
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'comentarios_lanzamientos', 'contactos', 'cotizaciones',
    'radio_providers', 'radios', 'monitored_artists', 'monitored_tracks',
    'radio_tracks', 'now_playing'
  )
ORDER BY c.relname;

-- No debe quedar ninguna política abierta (qual o with_check igual a true).
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('comentarios_lanzamientos', 'contactos', 'cotizaciones')
ORDER BY tablename, policyname;

-- Las dos funciones de trigger no deben ser ejecutables por anon ni authenticated.
SELECT
  p.proname AS funcion,
  p.prosecdef AS security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('check_social_post_availability', 'protect_admin_social_post_fields');

-- La vista no debe tener permisos para clientes y debe usar el invocador.
SELECT
  c.relname AS vista,
  c.reloptions,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_select
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'social_accounts_public';
