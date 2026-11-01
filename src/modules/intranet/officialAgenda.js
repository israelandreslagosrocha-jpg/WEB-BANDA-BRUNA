import { chileISO } from './time.js';
export function officialAgenda(events,entries){
 const official=new Map(events.filter(e=>e.publicado!==false&&/^\d{4}-\d{2}-\d{2}$/.test(e.fecha||'')).map(e=>[String(e.id),e]));
 const linked=new Set();
 const plans=entries.map(entry=>{
  const id=entry.event_details?.official_event_id;if(!id)return entry;
  const event=official.get(String(id));if(!event)return {...entry,official_missing:true};
  linked.add(String(id));
  const hour=entry.starts_at&&!entry.all_day?new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(entry.starts_at)):null;
  return {...entry,title:event.nombre,location:[event.lugar,event.ciudad].filter(Boolean).join(' · '),starts_at:chileISO(event.fecha+'T'+(hour||'12:00')),all_day:!hour,official_source:true,official_date:event.fecha};
 });
 const grouped=[];const seen=new Map();
 for(const plan of plans){const key=plan.official_source?String(plan.event_details.official_event_id):null;if(key&&seen.has(key)){seen.get(key).related_entries.push(plan);}else{const row={...plan,related_entries:[]};grouped.push(row);if(key)seen.set(key,row);}}
 return [...grouped,...[...official.values()].filter(e=>!linked.has(String(e.id))).map(e=>({id:'official-'+e.id,kind:'evento',title:e.nombre,starts_at:chileISO(e.fecha+'T12:00'),all_day:true,location:[e.lugar,e.ciudad].filter(Boolean).join(' · '),body:'Fecha de la agenda oficial de Banda Bruna. Horario y ficha interna por confirmar.',recipients:[],checklist:[],rehearsal:{},event_details:{category:'tocata',official_event_id:String(e.id)},official_source:true,official_only:true,official_date:e.fecha}))];
}
