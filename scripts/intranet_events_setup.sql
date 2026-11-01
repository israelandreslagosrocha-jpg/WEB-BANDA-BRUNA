-- Ejecutar después de intranet_setup.sql. Cambios adicionales de eventos personales.
begin;
alter table public.intranet_entries add column if not exists event_details jsonb not null default '{}'::jsonb;
alter table public.intranet_entries add constraint intranet_event_details_object check(jsonb_typeof(event_details)='object' and (kind in ('evento','tenida') or event_details='{}'::jsonb));
alter table public.intranet_receipts add column if not exists personal_checklist jsonb not null default '[]'::jsonb;
create or replace function public.intranet_valid_checklist(items jsonb) returns boolean language plpgsql immutable set search_path=public as $$
declare item jsonb;
begin
 if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items)>50 then return false; end if;
 for item in select value from jsonb_array_elements(items) loop
  if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'text') is distinct from 'string' or length(item->>'text') not between 1 and 300 or jsonb_typeof(item->'done') is distinct from 'boolean' or jsonb_typeof(item->'id') is distinct from 'string' then return false; end if;
 end loop;
 return true;
end $$;
alter table public.intranet_receipts add constraint intranet_personal_checklist_valid check(public.intranet_valid_checklist(personal_checklist));
create table public.intranet_event_payments (
 entry_id uuid not null references public.intranet_entries(id) on delete cascade,
 member_email text not null references public.intranet_members(email),
 amount_clp bigint not null check(amount_clp between 0 and 100000000),
 primary key(entry_id,member_email)
);
alter table public.intranet_event_payments enable row level security;
create policy event_payment_read on public.intranet_event_payments for select to authenticated using(
 (member_email=lower(auth.jwt()->>'email') or public.intranet_role()='jefatura') and exists(select 1 from public.intranet_entries where id=entry_id)
);
create policy event_payment_insert on public.intranet_event_payments for insert to authenticated with check(
 public.intranet_role()='jefatura' and exists(select 1 from public.intranet_entries e where e.id=entry_id and e.kind in ('evento','tenida') and e.author=auth.uid() and (cardinality(e.recipients)=0 or member_email=any(e.recipients)))
);
grant select,insert on public.intranet_event_payments to authenticated;
-- Publicación atómica: el aviso y todos los pagos se guardan juntos, o ninguno.
create or replace function public.publish_intranet_event(payload jsonb,payments jsonb default '[]'::jsonb) returns uuid language plpgsql security invoker set search_path=public as $$
declare result_id uuid; payment jsonb;
begin
 if public.intranet_role() is distinct from 'jefatura' then raise exception 'Solo jefatura puede publicar eventos'; end if;
 if payload->>'kind' not in ('evento','tenida') or payload->>'kind' is null then raise exception 'Tipo de evento inválido'; end if;
 if jsonb_typeof(payments) is distinct from 'array' or jsonb_array_length(payments)>7 then raise exception 'Pagos inválidos'; end if;
 insert into public.intranet_entries(kind,title,body,recipients,starts_at,location,outfit_id,outfit_text,mix_mode,checklist,file_path,file_name,file_mime,rehearsal,event_details)
 values(payload->>'kind',payload->>'title',coalesce(payload->>'body',''),array(select jsonb_array_elements_text(coalesce(payload->'recipients','[]'::jsonb))),(payload->>'starts_at')::timestamptz,coalesce(payload->>'location',''),nullif(payload->>'outfit_id','')::uuid,coalesce(payload->>'outfit_text',''),coalesce(payload->>'mix_mode',''),array(select jsonb_array_elements_text(coalesce(payload->'checklist','[]'::jsonb))),payload->>'file_path',payload->>'file_name',payload->>'file_mime',coalesce(payload->'rehearsal','{}'::jsonb),coalesce(payload->'event_details','{}'::jsonb)) returning id into result_id;
 for payment in select value from jsonb_array_elements(payments) loop
  insert into public.intranet_event_payments(entry_id,member_email,amount_clp) values(result_id,lower(payment->>'member_email'),(payment->>'amount_clp')::bigint);
 end loop;
 return result_id;
end $$;
revoke all on function public.publish_intranet_event(jsonb,jsonb) from public,anon;
grant execute on function public.publish_intranet_event(jsonb,jsonb) to authenticated;
commit;
