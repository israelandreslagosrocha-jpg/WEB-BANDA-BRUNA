const chileDay=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
export function isPastActivity(entry,entries=[],officialEvents=[],now=new Date()){
 let item=entry;
 if(entry.event_context){
  if(entry.event_context.startsWith('official:')){const event=officialEvents.find(e=>String(e.id)===entry.event_context.slice(9));if(event)return event.fecha<chileDay(now);}
  if(entry.event_context.startsWith('entry:'))item=entries.find(e=>e.id===entry.event_context.slice(6))||entry;
 }
 const official=officialEvents.find(e=>String(e.id)===String(item.event_details?.official_event_id));
 if(official)return official.fecha<chileDay(now);
 return ['evento','tenida','ensayo'].includes(item.kind)&&!!item.starts_at&&chileDay(item.starts_at)<chileDay(now);
}
