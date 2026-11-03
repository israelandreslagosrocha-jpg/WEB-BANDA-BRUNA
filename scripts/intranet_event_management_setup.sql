-- Gestión de fichas existentes. Aplicar después de intranet_workflow_setup.sql.
begin;
alter table public.intranet_entries add column if not exists revision integer not null default 1;
alter table public.intranet_entries add column if not exists event_context text;
alter table public.intranet_entries add constraint intranet_notice_context_valid check(event_context is null or (kind='comunicado' and length(event_context)<=300));
create function public.intranet_guard_event_context() returns trigger language plpgsql set search_path=public as $$
declare parent public.intranet_entries;
begin
 if new.event_context is null then return new; end if;
 if new.kind<>'comunicado' or public.intranet_role() is distinct from 'jefatura' then raise exception 'Solo jefatura puede enviar comunicados asociados al evento'; end if;
 if new.event_context like 'entry:%' then
  select * into parent from public.intranet_entries e where e.id=substring(new.event_context from 7)::uuid and e.kind in ('evento','tenida') and (cardinality(e.recipients)=0 or lower(auth.jwt()->>'email')=any(e.recipients) or e.author=auth.uid());
  if not found then raise exception 'Evento no disponible'; end if;
  if cardinality(parent.recipients)>0 and (cardinality(new.recipients)=0 or not new.recipients<@parent.recipients) then raise exception 'El comunicado debe mantener la privacidad del evento'; end if;
 elsif new.event_context like 'official:%' then
  if not exists(select 1 from public.eventos where id::text=substring(new.event_context from 10) and publicado=true) then raise exception 'Fecha oficial no disponible'; end if;
 else raise exception 'Referencia de evento inválida'; end if;
 return new;
end $$;
create trigger intranet_context_before_publish before insert on public.intranet_entries for each row execute function public.intranet_guard_event_context();
revoke all on function public.intranet_guard_event_context() from public,anon,authenticated;
create function public.update_intranet_event(target_id uuid,expected_revision integer,payload jsonb,payments jsonb default null) returns uuid language plpgsql security definer set search_path=public as $$
declare parent public.intranet_entries; details jsonb; tasks text[]; payment jsonb; context text; new_start timestamptz;
begin
 if public.intranet_role() is distinct from 'jefatura' or auth.uid() is null then raise exception 'Solo Jaime y César pueden editar eventos y tenidas'; end if;
 select * into parent from public.intranet_entries e where e.id=target_id and e.kind in ('evento','tenida') and (cardinality(e.recipients)=0 or lower(auth.jwt()->>'email')=any(e.recipients) or e.author=auth.uid()) for update;
 if not found then raise exception 'Evento no disponible'; end if;
 if expected_revision is distinct from parent.revision then raise exception 'El evento cambió mientras lo editabas. Actualiza la ficha antes de guardar'; end if;
 if jsonb_typeof(payload) is distinct from 'object' or length(payload::text)>100000 then raise exception 'Datos del evento inválidos'; end if;
 if coalesce(payload->'rehearsal','{}'::jsonb)<>'{}'::jsonb or coalesce(payload->>'mix_mode','')<>'' then raise exception 'El setlist solo lo edita Vicente'; end if;
 if payload ? 'recipients' and array(select jsonb_array_elements_text(payload->'recipients')) is distinct from parent.recipients then raise exception 'Los destinatarios del evento se conservan al editar'; end if;
 details:=coalesce(payload->'event_details','{}'::jsonb);
 if jsonb_typeof(details) is distinct from 'object' or coalesce(details->>'official_event_id','')<>coalesce(parent.event_details->>'official_event_id','') then raise exception 'El vínculo con la agenda oficial se conserva al editar'; end if;
 if coalesce(details->>'category','tocata') not in ('tocata','especial','junta') or coalesce(details->>'status','confirmado') not in ('confirmado','presupuestado') then raise exception 'Estado o categoría inválidos'; end if;
 if length(coalesce(details->>'meeting_point',''))>300 or length(coalesce(payload->>'body',''))>20000 or length(coalesce(payload->>'location',''))>300 or length(coalesce(payload->>'outfit_text',''))>1000 then raise exception 'Los datos superan el límite permitido'; end if;
 if nullif(details->>'departure_at','') is not null then perform (details->>'departure_at')::timestamptz; end if;
 new_start:=nullif(payload->>'starts_at','')::timestamptz;
 if new_start is null and coalesce(parent.event_details->>'official_event_id','')='' then raise exception 'El evento requiere una fecha'; end if;
 if jsonb_typeof(coalesce(payload->'checklist','[]'::jsonb)) is distinct from 'array' then raise exception 'Preparativos inválidos'; end if;
 if exists(select 1 from jsonb_array_elements(coalesce(payload->'checklist','[]'::jsonb)) item where jsonb_typeof(item)<>'string' or length(item#>>'{}')>300) then raise exception 'Cada preparativo admite hasta 300 caracteres'; end if;
 tasks:=array(select jsonb_array_elements_text(coalesce(payload->'checklist','[]'::jsonb)));
 if payments is not null and (jsonb_typeof(payments) is distinct from 'array' or jsonb_array_length(payments)>7) then raise exception 'Pagos inválidos'; end if;
 update public.intranet_entries set title=trim(payload->>'title'),body=coalesce(payload->>'body',''),starts_at=new_start,location=coalesce(payload->>'location',''),outfit_id=nullif(payload->>'outfit_id','')::uuid,outfit_text=coalesce(payload->>'outfit_text',''),checklist=tasks,event_details=details,revision=revision+1 where id=target_id;
 if parent.checklist is distinct from tasks then update public.intranet_receipts set completed='{}' where entry_id=target_id; end if;
 if payments is not null then
  delete from public.intranet_event_payments where entry_id=target_id;
  for payment in select value from jsonb_array_elements(payments) loop
   if cardinality(parent.recipients)>0 and not lower(payment->>'member_email')=any(parent.recipients) then raise exception 'Pago fuera de los destinatarios del evento'; end if;
   insert into public.intranet_event_payments(entry_id,member_email,amount_clp) values(target_id,lower(payment->>'member_email'),(payment->>'amount_clp')::bigint);
  end loop;
 end if;
 context:=case when coalesce(parent.event_details->>'official_event_id','')<>'' then 'official:'||(parent.event_details->>'official_event_id') else 'entry:'||target_id::text end;
 insert into public.intranet_entries(kind,title,body,recipients,event_context,author,author_email) values('comunicado',left('Evento actualizado · '||trim(payload->>'title'),200),'Jefatura actualizó la ficha del evento. Revisa los horarios, la tenida y las indicaciones antes de la salida.',parent.recipients,context,auth.uid(),lower(auth.jwt()->>'email'));
 return target_id;
end $$;
revoke all on function public.update_intranet_event(uuid,integer,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.update_intranet_event(uuid,integer,jsonb,jsonb) to authenticated;
commit;
