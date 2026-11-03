-- Solo el autor puede borrar sus comunicados, indicaciones y ensayos.
-- Las fechas oficiales y sus fichas de evento no se borran desde la intranet.
begin;
create or replace function public.delete_intranet_entry(target_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare item public.intranet_entries%rowtype;
begin
 if auth.uid() is null or public.intranet_role() is null then
  raise exception 'Debes iniciar sesión en la intranet.';
 end if;
 select * into item from public.intranet_entries where id=target_id for update;
 if not found or item.author is distinct from auth.uid() then
  raise exception 'Solo quien creó la publicación puede borrarla.';
 end if;
 if item.kind not in ('comunicado','personal','ensayo') or nullif(item.event_details->>'official_event_id','') is not null then
  raise exception 'Los eventos se administran desde la agenda general.';
 end if;
 delete from public.intranet_entries where id=target_id;
end;
$$;
revoke all on function public.delete_intranet_entry(uuid) from public, anon;
grant execute on function public.delete_intranet_entry(uuid) to authenticated;
commit;
