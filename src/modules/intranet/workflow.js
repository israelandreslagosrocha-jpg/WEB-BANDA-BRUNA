export const directorEmail='vicentenunez@bandabruna.cl';
export const pendingSetlist='A la espera de indicaciones de Vicente como director musical para el setlist de este evento.';
export function publicationKinds(role){return role==='jefatura'?['comunicado','evento','ensayo','personal']:role==='director'?['comunicado','ensayo','personal']:[];}
export function publicationFields(role,kind){return {schedule:['evento','ensayo'].includes(kind),event:role==='jefatura'&&kind==='evento',personal:kind==='personal',music:role==='director'&&kind==='personal'};}
export function musicTarget(entry){return entry.event_details?.official_event_id?'official:'+entry.event_details.official_event_id:'entry:'+entry.id;}
export function complementMusic(entries,plans){return entries.map(entry=>{
 const plan=plans.find(p=>p.target_key===musicTarget(entry));
 const isSchedule=['evento','tenida','ensayo'].includes(entry.kind);
 const legacyMusic=entry.author_email===directorEmail?entry.rehearsal?.music||[]:[];
 const music=plan?plan.music:legacyMusic;
 return {...entry,...(isSchedule?{rehearsal:{...(entry.author_email===directorEmail?entry.rehearsal:{}),music},musical_notes:plan?.general_notes||'',musical_updated_at:plan?.updated_at||null,setlist_pending:!music.length}:{}),related_entries:entry.related_entries?complementMusic(entry.related_entries,plans):undefined};
 });}
export function pendingText(entry){return entry.kind==='ensayo'?'Setlist del ensayo aún no proporcionado ni ordenado por Vicente.':pendingSetlist;}
