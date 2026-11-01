-- Aplicar después de intranet_push_setup.sql. Solicitudes asíncronas tras commit.
create extension if not exists pg_net with schema extensions;
create or replace function public.intranet_wake_push() returns trigger language plpgsql security definer set search_path=public as $$
declare delivery_url text; delivery_secret text;
begin
 select decrypted_secret into delivery_url from vault.decrypted_secrets where name='intranet_push_delivery_url';
 select decrypted_secret into delivery_secret from vault.decrypted_secrets where name='intranet_push_worker_secret';
 if delivery_url is not null and delivery_secret is not null then
  perform net.http_post(url:=delivery_url,headers:=jsonb_build_object('Content-Type','application/json','x-push-secret',delivery_secret),body:='{}'::jsonb,timeout_milliseconds:=15000);
 end if;
 return null;
exception when others then
 -- La publicación sigue disponible aunque falle el despertador; Cron recupera la cola.
 return null;
end $$;
revoke all on function public.intranet_wake_push() from public,anon,authenticated;
create trigger intranet_push_wake after insert on public.intranet_push_outbox for each statement execute function public.intranet_wake_push();
