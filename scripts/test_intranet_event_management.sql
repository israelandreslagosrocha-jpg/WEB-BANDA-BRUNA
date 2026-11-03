-- Ejecutar tras la migración dentro de la misma transacción, sin COMMIT. Revertir todo al terminar.
do $$ begin
 perform set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'email',lower(email),'role','authenticated')::text from auth.users where lower(email)='jaimecardenas@bandabruna.cl'),true);
end $$;
set local role authenticated;
do $$ declare id uuid; begin
 id:=public.publish_intranet_event('{"kind":"evento","title":"TEST · no publicar","starts_at":"2026-12-12T22:00:00Z","location":"Teatro","checklist":["Body"],"event_details":{}}','[{"member_email":"gersonulloa@bandabruna.cl","amount_clp":50000}]');
 perform set_config('intranet.edit_test_id',id::text,true);
 insert into public.intranet_receipts(entry_id,user_id,completed,personal_checklist) values(id,auth.uid(),array[0],'[{"id":"personal","text":"Audífonos","done":true}]');
end $$;
reset role;
do $$ begin perform set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'email',lower(email),'role','authenticated')::text from auth.users where lower(email)='vicentenunez@bandabruna.cl'),true);end $$;
set local role authenticated;
do $$ begin
 perform public.save_intranet_musical_plan('entry:'||current_setting('intranet.edit_test_id'),'[{"id":"viking-1","purpose":"show","mode":"bruto","notes":"Entradas"}]','Plan del director');
 begin
  perform public.update_intranet_event(current_setting('intranet.edit_test_id')::uuid,1,'{}',null);
  raise exception 'TEST_FAIL: director editó logística';
 exception when raise_exception then if sqlerrm not like 'Solo Jaime y César%' then raise; end if;end;
end $$;
reset role;
do $$ begin perform set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'email',lower(email),'role','authenticated')::text from auth.users where lower(email)='cesarbruna@bandabruna.cl'),true);end $$;
set local role authenticated;
do $$ declare test_id uuid:=current_setting('intranet.edit_test_id')::uuid; private_id uuid; begin
 perform public.update_intranet_event(test_id,1,'{"kind":"evento","title":"Evento editado","body":"Nueva logística","starts_at":"2026-12-12T23:00:00Z","location":"Teatro actualizado","outfit_text":"Azul Gala","checklist":["Revisar cables"],"event_details":{"category":"tocata","status":"confirmado"}}','[{"member_email":"gersonulloa@bandabruna.cl","amount_clp":60000}]');
 if not exists(select 1 from public.intranet_entries where intranet_entries.id=test_id and title='Evento editado' and revision=2 and author_email='jaimecardenas@bandabruna.cl') then raise exception 'TEST_FAIL: edición o autor incorrectos';end if;
 if not exists(select 1 from public.intranet_musical_plans where entry_id=test_id and music->0->>'id'='viking-1') then raise exception 'TEST_FAIL: se alteró el setlist';end if;
 if not exists(select 1 from public.intranet_entries where event_context='entry:'||test_id::text and kind='comunicado') then raise exception 'TEST_FAIL: falta aviso asociado';end if;
 begin
  perform public.update_intranet_event(test_id,1,'{}',null);
  raise exception 'TEST_FAIL: se aceptó una revisión antigua';
 exception when raise_exception then if sqlerrm not like 'El evento cambió%' then raise;end if;end;
 begin
  perform public.update_intranet_event(test_id,2,'{"rehearsal":{"music":[]}}',null);
  raise exception 'TEST_FAIL: jefatura editó música';
 exception when raise_exception then if sqlerrm not like 'El setlist solo lo edita Vicente%' then raise;end if;end;
 private_id:=public.publish_intranet_event('{"kind":"evento","title":"Privado de prueba","recipients":["gersonulloa@bandabruna.cl"],"starts_at":"2026-12-01T22:00:00Z","event_details":{}}','[]');
 begin
  insert into public.intranet_entries(kind,title,event_context) values('comunicado','No ampliar audiencia','entry:'||private_id::text);
  raise exception 'TEST_FAIL: se amplió la audiencia privada';
 exception when raise_exception then if sqlerrm not like 'El comunicado debe mantener la privacidad%' then raise;end if;end;
end $$;
reset role;
do $$ begin perform set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'email',lower(email),'role','authenticated')::text from auth.users where lower(email)='gersonulloa@bandabruna.cl'),true);end $$;
set local role authenticated;
do $$ declare changed integer; begin
 if not exists(select 1 from public.intranet_event_payments where entry_id=current_setting('intranet.edit_test_id')::uuid and amount_clp=60000) then raise exception 'TEST_FAIL: pago personal incorrecto';end if;
 begin
  perform public.update_intranet_event(current_setting('intranet.edit_test_id')::uuid,2,'{}',null);
  raise exception 'TEST_FAIL: integrante editó evento';
 exception when raise_exception then if sqlerrm not like 'Solo Jaime y César%' then raise;end if;end;
 begin
  update public.intranet_entries set title='No permitido' where id=current_setting('intranet.edit_test_id')::uuid;
  get diagnostics changed = row_count;
  if changed<>0 then raise exception 'TEST_FAIL: acceso de UPDATE directo';end if;
 exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$ begin
 if not exists(select 1 from public.intranet_receipts where entry_id=current_setting('intranet.edit_test_id')::uuid and personal_checklist->0->>'text'='Audífonos' and cardinality(completed)=0) then raise exception 'TEST_FAIL: checklist personal o preparativos incorrectos';end if;
end $$;
rollback;
select 'OK: edición por jefatura, setlist intacto, pagos personales, privacidad y concurrencia; pruebas revertidas' as resultado;
