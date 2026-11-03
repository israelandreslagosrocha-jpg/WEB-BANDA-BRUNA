import { canDeleteEntry, deleteEntryButton } from './deletion.js';
import { eventPage } from './eventPage.js';
import { pdfDownloadButton, publicationCopy } from './actions.js';
import { publicationKinds, publicationFields, musicTarget, complementMusic, pendingText } from './workflow';
import { officialAgenda } from './officialAgenda';
import { agendaView, rehearsalView, dayKey } from './schedule';
import { setupPush } from './pushClient';
import { outfitFor } from './outfits';
import { setupLibrary, selectedMusic, clearMusic, musicSummary, setSelectedMusic } from './library';
import { chileISO } from './time';
import { supabase as liveSupabase } from '../../services/supabaseClient';
let supabase: any = liveSupabase;
import { members, memberFor } from './members';
import { escapeHtml as esc } from '../../utils/escapeHtml';
const $ = (id: string) => document.getElementById(id)!;
let officialEvents:any[]=[],officialError='',musicPlans:any[]=[],currentRole='miembro';
let musicalTargets=new Map<string,any>();let refreshPublisher=()=>{};let selectedEventKey='';let editingEvent:any=null,noticeContext:string|null=null,publicationEventKey='',clearOutfitRequested=false;let editEvent: (key:string,outfit?:boolean)=>Promise<void>=async()=>{};let composeEventNotice:(key:string)=>void=()=>{};let resetPublication=()=>{};
let user: any, entries: any[] = [], receipts: any[] = [], payments: any[] = [], filter = '', busy = false;
const rehearsalLabels: Record<string,string> = {internal_work:'Trabajo interno y participantes',next_rehearsal:'Próximo ensayo',show_setlist:'Repertorio del próximo show',new_songs:'Canciones nuevas'};
const kinds: Record<string,string> = {comunicado:'Comunicado',evento:'Evento',ensayo:'Ensayo',repertorio:'Repertorio',cancion:'Canción / mix',personal:'Indicación personal',tenida:'Tenida para evento'};
function check(result: any) { if (result.error) throw result.error; return result.data; }
function message(error: any) { $('status').textContent = `No se pudo completar: ${error.message || error}. Si la intranet aún no está habilitada, falta aplicar su configuración en Supabase.`; }
function date(value: string,allDay=false) {return new Intl.DateTimeFormat('es-CL',{dateStyle:'full',...(allDay?{}:{timeStyle:'short' as const}),timeZone:'America/Santiago'}).format(new Date(value))+(allDay?' · Hora por confirmar':'');}
async function load() {
 if(busy) return; busy=true;
 try {
  const [a,b,c,d] = await Promise.all([supabase.from('intranet_entries').select('*').order('created_at',{ascending:false}),supabase.from('intranet_receipts').select('*').eq('user_id',user.id),supabase.from('intranet_event_payments').select('*').eq('member_email',user.email.toLowerCase()),supabase.from('intranet_musical_plans').select('*')]);
  musicPlans=check(d)||[];entries=complementMusic(check(a)||[],musicPlans); receipts=check(b)||[]; payments=check(c)||[];
  try{officialEvents=(supabase as any).previewOfficialEvents||await officialAgendaRequest();officialError='';}catch{officialError='No se pudo actualizar la agenda oficial. Se muestran los avisos internos; pulsa Actualizar avisos para reintentar.';}
  const officialSelect=$('official-event') as HTMLSelectElement;const oldSelection=officialSelect.value;officialSelect.innerHTML='<option value="">Actividad independiente</option>'+officialEvents.filter(e=>e.fecha>=dayKey(new Date())).map(e=>`<option value="${esc(e.id)}">${esc(e.fecha)} · ${esc(e.nombre)}</option>`).join('');officialSelect.value=oldSelection;
  refreshMusicalTargets();render(); $('status').textContent=officialError;
 } catch(e) {message(e);} finally {busy=false;}
}
function agendaEntries(){return complementMusic(officialAgenda(officialEvents,entries.filter(e=>['evento','tenida','ensayo'].includes(e.kind))),musicPlans);}
function eventForKey(key:string){return agendaEntries().find(e=>musicTarget(e)===key);}
function openEvent(key:string,history=true){const entry=eventForKey(key);if(!entry){$('status').textContent='No se encontró una ficha disponible para tu perfil.';return;}selectedEventKey=key;openSection('event');if(history&&new URLSearchParams(location.hash.slice(1)).get('evento')!==key)window.history.pushState(null,'','#evento='+encodeURIComponent(key));}
function localDateTime(value:string){return value?new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value)).replace(' ','T'):'';}

function openSection(next: string) {
 filter=next;
 $('section-picker').hidden=true;
 $('section-content').hidden=false;
 $('feed-section').hidden=['publish','music-plan'].includes(next);
 $('music-director').hidden=next!=='music-plan';
 const picker=$('music-picker');if(next==='music-plan'){$('musical-picker-slot').append(picker);picker.hidden=false;loadTargetMusic();}else{$('personal-music-slot').append(picker);refreshPublisher();}
 $('publisher').hidden=next!=='publish';
 $('repertoire-library').hidden=next!=='material';
 $('section-title').textContent=({todos:'Toda la información',pendientes:'Avisos sin leer',agenda:'Agenda',ensayo:'Ensayos',material:'Material',personal:'Para mí',publish:publicationCopy[($('kind') as HTMLSelectElement).value]?.title||'Enviar comunicado','music-plan':'Dirección musical',event:'Ficha del evento'} as Record<string,string>)[next] || 'Tu información';
 $('back-sections').textContent=next==='event'?'← Volver a la agenda':next==='publish'&&publicationEventKey?'← Volver a la ficha':'← Volver a mi intranet';
 render();
 $('section-title').focus({preventScroll:true});
 $('section-content').scrollIntoView({behavior:'smooth',block:'start'});
}
function directorPlanButton(entry:any){return currentRole==='director'&&['evento','tenida','ensayo'].includes(entry.kind)&&musicalTargets.has(musicTarget(entry))?`<button class="setlist-edit-action" data-edit-music-target="${esc(musicTarget(entry))}">${entry.rehearsal?.music?.length?'Editar setlist de esta fecha':'Agregar setlist a esta fecha'}</button>`:'';}
function refreshMusicalTargets(){
 const old=($('music-target') as HTMLSelectElement).value;musicalTargets=new Map();
 const rows=complementMusic(officialAgenda(officialEvents,entries.filter(e=>['evento','tenida','ensayo'].includes(e.kind))),musicPlans).sort((a,b)=>(a.starts_at||'9999').localeCompare(b.starts_at||'9999'));
 for(const entry of rows)if(!entry.starts_at||dayKey(entry.starts_at)>=dayKey(new Date()))musicalTargets.set(musicTarget(entry),entry);
 $('music-target').innerHTML='<option value="">Selecciona evento o ensayo</option>'+[...musicalTargets.entries()].map(([key,e])=>`<option value="${esc(key)}" data-kind="${e.kind}">${e.starts_at?esc(date(e.starts_at,e.all_day))+' · ':''}${esc(e.title)}</option>`).join('');($('music-target') as HTMLSelectElement).value=old;
 $('music-target-list').innerHTML=`<table class="schedule-table"><thead><tr><th>Fecha</th><th>Evento o ensayo</th><th>Setlist</th><th>Acción</th></tr></thead><tbody>${[...musicalTargets.entries()].map(([key,e])=>`<tr><td>${e.starts_at?esc(date(e.starts_at,e.all_day)):'Fecha por confirmar'}</td><td><strong>${esc(e.title)}</strong><small>${e.kind==='ensayo'?'Ensayo':e.official_source?'Evento de agenda oficial':'Evento creado por jefatura'}</small><span>${esc(e.location||'Lugar por confirmar')}</span></td><td>${e.rehearsal?.music?.length?'Setlist disponible':'Pendiente de Vicente'}</td><td><button type="button" class="setlist-edit-action" data-select-music-target="${esc(key)}">${e.rehearsal?.music?.length?'Editar setlist':'Agregar setlist'}</button></td></tr>`).join('')||'<tr><td colspan="4">No hay eventos ni ensayos próximos. Los eventos aparecerán cuando Jaime o César los creen o se confirmen en la agenda oficial.</td></tr>'}</tbody></table>`;
}
function loadTargetMusic(){const key=($('music-target') as HTMLSelectElement).value;const entry=musicalTargets.get(key);const plan=musicPlans.find(p=>p.target_key===key);setSelectedMusic(plan?.music||entry?.rehearsal?.music||[]);($('musical-notes') as HTMLTextAreaElement).value=plan?.general_notes||'';$('music-target-info').textContent=entry?`${entry.location||'Lugar por confirmar'} · La tenida y la logística se definen desde jefatura.`:'';$('musical-save-status').textContent='';}
function eventMarkup(e:any,receipt:any){
 if(!['evento','tenida'].includes(e.kind))return '';
 const info=e.event_details||{};const outfit=outfitFor(info.outfit_slug);const pay=payments.find(p=>p.entry_id===e.id);
 const extra=receipt?.personal_checklist||[];
 return `<div class="event-data"><p>Salida: ${info.departure_at?esc(date(info.departure_at)):'Por confirmar'}</p><p>Tocata: ${e.starts_at?esc(date(e.starts_at,e.all_day)):'Por confirmar'}</p><p>Encuentro: ${esc(info.meeting_point||'Por confirmar')}</p><p>Mi valor a recibir: ${pay?esc(new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(pay.amount_clp)):'Por confirmar'}</p></div>${outfit?`<h3>${esc(outfit.name)}</h3><img class="event-outfit" src="${esc(outfit.cloudinaryUrl||outfit.image)}" alt="Tenida LEGO ${esc(outfit.name)}"/><p>${esc(outfit.description)}</p>`:''}<details><summary>Mi checklist personal · ${extra.filter((t:any)=>t.done).length}/${extra.length} preparados</summary>${extra.map((t:any)=>`<div class="personal-task"><label><input type="checkbox" data-personal-entry="${e.id}" data-personal-task="${esc(t.id)}" ${t.done?'checked':''}/> ${esc(t.text)}</label><button data-remove-task="${esc(t.id)}" data-task-entry="${e.id}">Quitar</button></div>`).join('')}<input id="new-task-${e.id}" data-new-task="${e.id}" maxlength="300" aria-label="Nuevo pendiente personal" placeholder="Ej.: cargar body, llevar audífonos…"/><button data-add-task="${e.id}">+ Agregar a mi checklist</button></details>`;
}
const initialDay=dayKey(new Date()).split('-').map(Number);
let calendarYear=initialDay[0],calendarMonth=initialDay[1]-1,calendarDay='';
function render() {
 $('unread').textContent=`${entries.filter(e=>!receipts.some(r=>r.entry_id===e.id && r.read_at)).length} avisos sin leer`;
 const visible=entries.filter(e=> filter==='todos' || (filter==='pendientes' && !receipts.some(r=>r.entry_id===e.id && r.read_at)) || (filter==='agenda' && ['evento','tenida','ensayo'].includes(e.kind)) || (filter==='material' && ['repertorio','cancion'].includes(e.kind)) || (filter==='personal' && e.recipients.includes(user.email.toLowerCase())) || filter===e.kind);
 if(filter==='agenda') visible.sort((a,b)=>(a.starts_at||'9999').localeCompare(b.starts_at||'9999'));
 const detail=(e:any)=>{
 if(e.official_only)return `<article class="entry"><h2>${esc(e.title)}</h2><p>${esc(e.location)}</p><p>Fecha de la agenda oficial: ${esc(e.official_date)}. Horario de tocata por confirmar.</p><p>Jaime y César completan la logística y la tenida. Vicente proporciona y ordena el setlist.</p><p class="pending-setlist" ${e.rehearsal?.music?.length?'hidden':''}>${esc(pendingText(e))}</p>${musicSummary(e.rehearsal?.music||[])}${e.musical_notes?`<p class="musical-general">${esc(e.musical_notes)}</p>`:''}${filter==='event'?'':directorPlanButton(e)}<a href="/agenda" target="_blank" rel="noopener">Ver agenda oficial ↗</a></article>`;
 const receipt=receipts.find(r=>r.entry_id===e.id); const author=memberFor(e.author_email)?.[1]||e.author_email;
 return `<article class="entry"><p class="entry-meta">${esc(kinds[e.kind])} · ${esc(author)} · ${esc(date(e.created_at))}${e.recipients.length?' · Privado':''}</p><h2>${esc(e.title)}</h2>${e.starts_at?`<p>${esc(date(e.starts_at,e.all_day))}</p>`:''}${e.location?`<p>📍 ${esc(e.location)}</p>`:''}<p class="entry-body">${esc(e.body)}</p>${Object.entries(rehearsalLabels).filter(([key])=>e.rehearsal?.[key]).map(([key,label])=>`<h3>${esc(label)}</h3><p class="entry-body">${esc(e.rehearsal[key])}</p>`).join('')}${eventMarkup(e,receipt)}${e.setlist_pending?`<p class="pending-setlist">${esc(pendingText(e))}</p>`:''}${e.musical_notes?`<p class="musical-general">Indicaciones de Vicente: ${esc(e.musical_notes)}</p>`:''}${filter==='event'?'':directorPlanButton(e)}${musicSummary(e.rehearsal?.music||[])}${!['agenda','ensayo'].includes(filter)&&(e.rehearsal?.music?.length||['evento','tenida','ensayo'].includes(e.kind))?pdfDownloadButton(e):''}${e.outfit_text?`<p>Tenida: ${esc(e.outfit_text)}</p>`:''}${e.mix_mode?`<p>Mix: ${esc(e.mix_mode)}</p>`:''}${e.checklist.map((item:string,i:number)=>`<label><input type="checkbox" data-entry="${e.id}" data-index="${i}" ${receipt?.completed.includes(i)?'checked':''}/> ${esc(item)}</label>`).join('')}${e.event_context?`<button class="event-context-link" data-open-event="${esc(e.event_context)}">Ver ficha del evento →</button>`:''}${e.file_path?`<button data-file="${e.id}">Abrir / descargar ${esc(e.file_name||'archivo')}</button><div id="file-${e.id}"></div>`:''}${deleteEntryButton(e,user)}<button data-read="${e.id}" ${receipt?.read_at?'disabled':''}>${receipt?.read_at?'✓ Leído':'Marcar como leído'}</button></article>`;
 };
 if(filter==='event'){const entry=eventForKey(selectedEventKey);$('section-title').textContent=entry?.kind==='ensayo'?'Ficha del ensayo':'Ficha del evento';$('feed').innerHTML=entry?eventPage(entry,currentRole,detail,entries.filter(e=>e.kind==='comunicado'&&e.event_context===selectedEventKey)):'<p>Esta ficha ya no está disponible para tu perfil.</p>';return;}
 if(filter==='agenda'){$('feed').innerHTML=agendaView(agendaEntries(),{year:calendarYear,month:calendarMonth,selectedDay:calendarDay},detail,currentRole);return;}
 if(filter==='ensayo'){$('feed').innerHTML=rehearsalView(visible,entries.filter(e=>e.kind==='personal'&&e.author_email==='vicentenunez@bandabruna.cl'&&e.recipients.includes(user.email.toLowerCase())),detail);return;}
 $('feed').innerHTML=visible.length?visible.map(detail).join(''):'<p>No hay información en esta sección.</p>';
}
async function saveReceipt(id: string, completed?: number[],personalChecklist?:any[]) {
 const previous=receipts.find(r=>r.entry_id===id);
 check(await supabase.from('intranet_receipts').upsert({entry_id:id,user_id:user.id,read_at:previous?.read_at||new Date().toISOString(),completed:completed||previous?.completed||[],personal_checklist:personalChecklist||previous?.personal_checklist||[]}));
 await load();
}
async function init() {
 const {data:{user: authenticated},error} = await supabase.auth.getUser();
 if(error||!authenticated||(!memberFor(authenticated.email)&&authenticated.email?.toLowerCase()!=='contacto@bandabruna.cl')){location.href='/admin';return;}
 user=authenticated; const member=memberFor(user.email)||['contacto@bandabruna.cl','Administración','jefatura'];
 currentRole=member[2];
 const adminLink=document.querySelector<HTMLAnchorElement>('a[href="/admin/dashboard"]'); if(adminLink)adminLink.hidden=user.email.toLowerCase()!=='contacto@bandabruna.cl';
 $('identity').textContent=`${member[1]} · ${member[2]==='director'?'Dirección musical':member[2]==='jefatura'?'Jefatura':'Integrante'}`;
 $('workspace').hidden=false;
 const stopPush=await setupPush(supabase,Boolean((supabase as any).previewCatalogue));
 $('logout').onclick=async()=>{try{await stopPush?.();}catch{ $('status').textContent='No se pudo desactivar este dispositivo. Reintenta antes de cerrar sesión.';return;}await supabase.auth.signOut();location.href='/admin';};
 $('refresh').onclick=load;
 document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(button=>button.onclick=()=>openSection(button.dataset.filter!));
 $('back-sections').onclick=()=>{if(filter==='event'){openSection('agenda');window.history.replaceState(null,'',location.pathname+location.search);return;}if(filter==='publish'&&publicationEventKey){const key=publicationEventKey;resetPublication();openEvent(key,false);return;}filter='';$('section-picker').hidden=false;$('section-content').hidden=true;$('section-picker').scrollIntoView({behavior:'smooth',block:'start'});};
 $('feed').addEventListener('click',async(event)=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button'); if(!button)return;
  if(button.hasAttribute('data-month-step')){const d=new Date(calendarYear,calendarMonth+Number(button.dataset.monthStep),1);calendarYear=d.getFullYear();calendarMonth=d.getMonth();calendarDay='';render();return;}
  if(button.hasAttribute('data-calendar-today')){const parts=dayKey(new Date()).split('-').map(Number);calendarYear=parts[0];calendarMonth=parts[1]-1;calendarDay='';render();return;}
  if(button.dataset.calendarDay){calendarDay=button.dataset.calendarDay;render();return;}
  if(button.hasAttribute('data-calendar-clear')){calendarDay='';render();return;}
  if(button.dataset.openEvent){openEvent(button.dataset.openEvent);return;}
  try {
   button.disabled=true;
   if(button.dataset.deleteEntry){
    const entry=entries.find(e=>e.id===button.dataset.deleteEntry);
    if(!entry||!canDeleteEntry(entry,user))throw new Error('Solo quien creó esta publicación puede borrarla.');
    if(!window.confirm(`¿Borrar «${entry.title}»? Se eliminará de la intranet para todos sus destinatarios. Esta acción no se puede deshacer.`))return;
    check(await supabase.rpc('delete_intranet_entry',{target_id:entry.id}));
    if(filter==='event'){filter='agenda';selectedEventKey='';window.history.replaceState(null,'',location.pathname+location.search);}
    await load();$('status').textContent='Publicación borrada.';return;
   }
   if(button.dataset.editEvent){await editEvent(button.dataset.editEvent,button.dataset.editOutfit==='true');return;}
   if(button.dataset.eventNotice){composeEventNotice(button.dataset.eventNotice);return;}
   if(button.dataset.editMusicTarget){openSection('music-plan');($('music-target') as HTMLSelectElement).value=button.dataset.editMusicTarget;loadTargetMusic();return;}
   if(button.dataset.addTask){const id=button.dataset.addTask;const input=$(`new-task-${id}`) as HTMLInputElement;const text=input.value.trim();if(!text)throw new Error('Escribe el pendiente que quieres agregar.');const tasks=receipts.find(r=>r.entry_id===id)?.personal_checklist||[];if(tasks.length>=50)throw new Error('Tu checklist admite hasta 50 puntos.');await saveReceipt(id,undefined,[...tasks,{id:crypto.randomUUID(),text,done:false}]);}
   if(button.dataset.removeTask){const id=button.dataset.taskEntry!;const tasks=receipts.find(r=>r.entry_id===id)?.personal_checklist||[];await saveReceipt(id,undefined,tasks.filter((t:any)=>t.id!==button.dataset.removeTask));}
   if(button.dataset.planPdf){const entry=entries.find(e=>e.id===button.dataset.planPdf);await getPlanPdf(entry);}
   if(button.dataset.read) await saveReceipt(button.dataset.read);
   if(button.dataset.file){const entry=entries.find(e=>e.id===button.dataset.file);const signed=check(await supabase.storage.from('intranet').createSignedUrl(entry.file_path,300));
    const holder=$(`file-${entry.id}`); holder.replaceChildren();
    if(entry.file_mime?.startsWith('audio/')){const audio=document.createElement('audio');audio.controls=true;audio.src=signed.signedUrl;holder.append(audio);}
    const link=document.createElement('a');link.href=signed.signedUrl;link.target='_blank';link.rel='noopener';link.textContent='Abrir archivo (enlace válido por 5 minutos)';link.className='file-link';holder.append(link);
   }
  }catch(e){message(e);}finally{button.disabled=false;}
 });
 $('feed').addEventListener('change',async(event)=>{
  const input=event.target as HTMLInputElement;
  if(input.dataset.personalEntry){const id=input.dataset.personalEntry;const tasks=receipts.find(r=>r.entry_id===id)?.personal_checklist||[];try{await saveReceipt(id,undefined,tasks.map((t:any)=>t.id===input.dataset.personalTask?{...t,done:input.checked}:t));}catch(e){input.checked=!input.checked;message(e);}return;}
  if(!input.dataset.entry)return;
  const id=input.dataset.entry,index=Number(input.dataset.index);const completed=new Set<number>(receipts.find(r=>r.entry_id===id)?.completed||[]);
  input.checked?completed.add(index):completed.delete(index);input.disabled=true;
  try{await saveReceipt(id,[...completed]);}catch(e){input.checked=!input.checked;input.disabled=false;message(e);}
 });
 if(member[2]!=='miembro') {
  $('team-actions').hidden=false;
  $('role-guidance').textContent=member[2]==='jefatura'?'Jaime y César crean los eventos y definen la logística y la tenida. Vicente completa el setlist.':'Como director musical, agregas el setlist a los eventos de Jaime y César o de la agenda oficial. También puedes enviar comunicados y programar ensayos.';
  resetPublication=()=>{editingEvent=null;noticeContext=null;publicationEventKey='';clearOutfitRequested=false;for(const id of ['kind','recipients','official-event'])($(id) as HTMLSelectElement).disabled=false;const form=$('publish-form') as HTMLFormElement;for(const name of ['title','location'])(form.elements.namedItem(name) as HTMLInputElement).readOnly=false;$('publication-context').hidden=true;$('editing-guidance').hidden=true;$('cancel-publication').hidden=true;$('publish-status').textContent='';};
  const openPublication=(kind:string)=>{if(!publicationKinds(member[2]).includes(kind))return;resetPublication();($('publish-form') as HTMLFormElement).reset();($('kind') as HTMLSelectElement).value=kind;clearMusic();document.querySelectorAll('[data-outfit-slug]').forEach(b=>b.setAttribute('aria-pressed','false'));$('outfit-choice').textContent='Ninguna tenida seleccionada.';openSection('publish');};
  $('cancel-publication').onclick=()=>{const key=publicationEventKey;resetPublication();if(key)openEvent(key,false);else openSection('agenda');};
  editEvent=async(key,outfit=false)=>{
   const e=eventForKey(key);if(member[2]!=='jefatura'||!e||!['evento','tenida'].includes(e.kind))throw new Error('Solo Jaime y César pueden editar esta ficha.');
   const eventPayments=e.official_only?[]:check(await supabase.from('intranet_event_payments').select('*').eq('entry_id',e.id));
   openPublication('evento');editingEvent=e.official_only?null:e;publicationEventKey=key;selectedEventKey=key;
   const form=$('publish-form') as HTMLFormElement;const set=(name:string,value:any)=>{(form.elements.namedItem(name) as HTMLInputElement).value=value??'';};
   set('title',e.title);set('body',e.body);set('starts_at',e.all_day?'':localDateTime(e.starts_at));set('location',e.location);set('departure_at',localDateTime(e.event_details?.departure_at));set('meeting_point',e.event_details?.meeting_point);set('event_category',e.event_details?.category||'tocata');set('event_status',e.event_details?.status||'confirmado');set('checklist',(e.checklist||[]).join('\n'));set('outfit_slug',e.event_details?.outfit_slug);set('outfit_id',e.outfit_id);
   const official=$('official-event') as HTMLSelectElement;const officialId=String(e.event_details?.official_event_id||'');if(officialId&&!Array.from(official.options).some(o=>o.value===officialId))official.insertAdjacentHTML('beforeend',`<option value="${esc(officialId)}">${esc(e.title)}</option>`);official.value=officialId;official.disabled=true;
   const recipients=$('recipients') as HTMLSelectElement;Array.from(recipients.options).forEach(o=>o.selected=e.recipients.includes(o.value));recipients.disabled=!!editingEvent;if(editingEvent)$('recipients-hint').textContent='Se conservan los destinatarios originales del evento.';($('kind') as HTMLSelectElement).disabled=true;
   for(const m of members)set('payment_'+m[0],eventPayments.find((p:any)=>p.member_email===m[0])?.amount_clp??'');
   document.querySelectorAll<HTMLButtonElement>('[data-outfit-slug]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.outfitSlug===e.event_details?.outfit_slug)));$('outfit-choice').textContent=e.outfit_text||outfitFor(e.event_details?.outfit_slug)?.name||'Tenida por confirmar.';
   $('publication-context').hidden=false;$('publication-context').textContent='Evento: '+e.title;$('editing-guidance').hidden=!editingEvent;$('cancel-publication').hidden=false;
   if(e.official_source){(form.elements.namedItem('title') as HTMLInputElement).readOnly=true;(form.elements.namedItem('location') as HTMLInputElement).readOnly=true;$('official-date-hint').textContent='La fecha, el nombre y el lugar provienen de la agenda oficial. Completa aquí la hora de tocata y la logística interna.';}
   refreshPublisher();if(outfit)$('outfit-fields').scrollIntoView({behavior:'smooth',block:'start'});
  };
  composeEventNotice=(key)=>{const e=eventForKey(key);if(member[2]!=='jefatura'||!e)return;openPublication('comunicado');noticeContext=key;publicationEventKey=key;($('kind') as HTMLSelectElement).disabled=true;const form=$('publish-form') as HTMLFormElement;(form.elements.namedItem('title') as HTMLInputElement).value=('Comunicado · '+e.title).slice(0,200);Array.from(($('recipients') as HTMLSelectElement).options).forEach(o=>o.selected=e.recipients.includes(o.value));$('publication-context').hidden=false;$('publication-context').textContent='Comunicado asociado a: '+e.title;$('cancel-publication').hidden=false;if(e.recipients.length)$('recipients-hint').textContent='Selecciona a los destinatarios del evento o a un subconjunto. No se puede ampliar su público.';};
  $('open-publisher').hidden=false;$('open-publisher').onclick=()=>openPublication('comunicado');
  $('register-rehearsal').hidden=false;$('register-rehearsal').onclick=()=>openPublication('ensayo');
  if(member[2]==='jefatura'){$('create-event').hidden=false;$('create-event').onclick=()=>openPublication('evento');}
  $('kind').innerHTML=publicationKinds(member[2]).map(k=>`<option value="${k}">${kinds[k]}</option>`).join('');
  const updateFields=()=>{
   const kind=($('kind') as HTMLSelectElement).value;const f=publicationFields(member[2],kind);const copy=publicationCopy[kind];
   $('publisher-title').textContent=copy.title;$('publisher-description').textContent=copy.description;$('publication-subject').textContent=copy.subject;$('send').textContent=copy.submit;if(editingEvent){$('publisher-title').textContent='Editar evento';$('send').textContent='Guardar cambios y notificar';}if(filter==='publish')$('section-title').textContent=editingEvent?'Editar evento':copy.title;
   $('schedule-fields').hidden=!f.schedule;$('event-fields').hidden=!f.event;$('event-pdf-options').hidden=!f.event;$('outfit-fields').hidden=!f.event;$('event-extras').hidden=!f.event;$('waiting-setlist').hidden=!f.schedule;
   $('personal-music-slot').hidden=!f.music;$('music-picker').hidden=filter!=='music-plan'&&!f.music;
   const form=$('publish-form') as HTMLFormElement;(form.elements.namedItem('starts_at') as HTMLInputElement).required=kind==='ensayo';(form.elements.namedItem('location') as HTMLInputElement).required=kind==='ensayo';
   const recipients=$('recipients') as HTMLSelectElement;recipients.multiple=!f.personal;recipients.size=f.personal?1:7;recipients.required=f.personal;
   if(f.personal&&!recipients.querySelector('option[value=""]')){recipients.insertAdjacentHTML('afterbegin','<option value="">Selecciona un integrante</option>');recipients.value='';}else if(!f.personal)recipients.querySelector('option[value=""]')?.remove();
   $('recipients-hint').textContent=f.personal?'Selecciona una sola persona.':'Sin selección: todos los integrantes.';
  };refreshPublisher=updateFields;
  $('kind').onchange=()=>{clearMusic();updateFields();};$('clear-outfit').onclick=()=>{clearOutfitRequested=true;($('outfit-slug') as HTMLInputElement).value='';($('outfits') as HTMLSelectElement).value='';document.querySelectorAll('[data-outfit-slug]').forEach(b=>b.setAttribute('aria-pressed','false'));$('outfit-choice').textContent='Tenida por confirmar.';};updateFields();
  if(member[2]==='director'){$('open-musical-plan').hidden=false;$('open-musical-plan').onclick=()=>openSection('music-plan');$('music-target').onchange=loadTargetMusic;
   $('music-target-list').addEventListener('click',event=>{const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-select-music-target]');if(!button)return;($('music-target') as HTMLSelectElement).value=button.dataset.selectMusicTarget!;loadTargetMusic();$('musical-plan-form').scrollIntoView({behavior:'smooth',block:'start'});$('music-target').focus({preventScroll:true});});
  }
  $('official-event').onchange=()=>{const event=officialEvents.find(e=>String(e.id)===($('official-event') as HTMLSelectElement).value);if(!event)return;const form=$('publish-form') as HTMLFormElement;const start=form.elements.namedItem('starts_at') as HTMLInputElement;if(start.value.split('T')[1])start.value=event.fecha+'T'+start.value.split('T')[1];$('official-date-hint').textContent=`Fecha oficial: ${event.fecha}. Completa la hora de tocata para la ficha.`;(form.elements.namedItem('location') as HTMLInputElement).value=[event.lugar,event.ciudad].filter(Boolean).join(' · ');(form.elements.namedItem('title') as HTMLInputElement).value=event.nombre;};
  const downloadDraft=async()=>{const form=$('publish-form') as HTMLFormElement;try{$('pdf-status').textContent='Preparando PDF…';const target=musicalTargets.get(($('music-target') as HTMLSelectElement).value);await getPlanPdf(filter==='music-plan'?{kind:'ensayo',title:'Setlist · '+(target?.title||'Plan musical'),starts_at:target?.starts_at,location:target?.location,music:selectedMusic(),body:($('musical-notes') as HTMLTextAreaElement).value}:draftPlan(new FormData(form)));$('pdf-status').textContent='PDF descargado.';}catch(e:any){$('pdf-status').textContent=e.message;}};
  $('draft-music-pdf').onclick=downloadDraft;$('event-draft-pdf').onclick=downloadDraft;
  $('recipients').innerHTML=members.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-outfit-slug]').forEach(button=>button.onclick=()=>{($('outfit-slug') as HTMLInputElement).value=button.dataset.outfitSlug!;($('outfits') as HTMLSelectElement).value='';document.querySelectorAll<HTMLButtonElement>('[data-outfit-slug]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('outfit-choice').textContent=`Tenida seleccionada: ${outfitFor(button.dataset.outfitSlug)?.name}`;});
  $('outfits').onchange=()=>{($('outfit-slug') as HTMLInputElement).value='';document.querySelectorAll('[data-outfit-slug]').forEach(b=>b.setAttribute('aria-pressed','false'));$('outfit-choice').textContent='Tenida personalizada seleccionada.';};
  async function outfits(){const rows=check(await supabase.from('intranet_outfits').select('*').order('name'));$('outfits').innerHTML='<option value="">Seleccionar tenida</option>'+rows.map((r:any)=>`<option value="${r.id}">${esc(r.name)} — ${esc(r.description)}</option>`).join('');}
  try{await outfits();}catch(e){message(e);}
  $('new-outfit').onclick=async()=>{const name=prompt('Nombre de la tenida');if(!name?.trim())return;const description=prompt('Prendas y detalles de esta tenida');if(description===null)return;try{check(await supabase.from('intranet_outfits').insert({name:name.trim(),description}));await outfits();}catch(e){message(e);}};
  $('checklist-template').onclick=()=>{const input=$('checklist') as HTMLTextAreaElement;input.value=[input.value,'Llevar body cargado','Llevar audífonos para in ear','Llevar alargadores y enchufes','Confirmar amenities / llevar snack','Revisar tiempo de viaje y hora de salida'].filter(Boolean).join('\n');};
  $('publish-form').addEventListener('submit',async(event)=>{
   event.preventDefault();const form=event.target as HTMLFormElement;const data=new FormData(form);const button=$('send') as HTMLButtonElement;button.disabled=true;let path:string|null=null;let published=false;
   try {
    const recipients=editingEvent?editingEvent.recipients:data.getAll('recipients').map(String).filter(Boolean);const kind=editingEvent?'evento':noticeContext?'comunicado':($('kind') as HTMLSelectElement).value;const fields=publicationFields(member[2],kind);
    if(!publicationKinds(member[2]).includes(kind))throw new Error('Tipo de información no disponible para tu rol.');
    if(kind==='personal' && recipients.length!==1)throw new Error('Selecciona exactamente un destinatario para la indicación personal.');
    const start=fields.schedule?String(data.get('starts_at')):'';const linkedOfficial=['evento','tenida'].includes(kind)?officialEvents.find(e=>String(e.id)===String(editingEvent?.event_details?.official_event_id||data.get('official_event_id')||eventForKey(publicationEventKey)?.event_details?.official_event_id||'')):null;const starts_at=start?chileISO(linkedOfficial?linkedOfficial.fecha+'T'+start.split('T')[1]:start):null;
    const checklist=(fields.event?String(data.get('checklist')||''):'').split('\n').map(v=>v.trim()).filter(Boolean);if(checklist.length>50)throw new Error('El checklist admite hasta 50 puntos.');
    const file=null as File|null;
    if(file?.size){if(file.size>52428800)throw new Error('El archivo supera 50 MB.');path=`${user.id}/${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;check(await supabase.storage.from('intranet').upload(path,file));}
    const outfit=$('outfits') as HTMLSelectElement;
    const chosen=outfitFor(String(data.get('outfit_slug')));
    if(kind==='tenida'&&(!(outfit.value||chosen)||!starts_at||!String(data.get('location')).trim()))throw new Error('Selecciona tenida, fecha y evento.');
    if(kind==='ensayo'&&(!starts_at||!String(data.get('location')||'').trim()))throw new Error('Completa fecha, hora y lugar del ensayo.');
    const payload:any={kind,title:String(data.get('title')).trim(),body:String(data.get('body')),recipients,starts_at,rehearsal:fields.music?{music:selectedMusic(),catalog_version:'2026-11-01'}:{},location:fields.schedule?String(data.get('location')||''):'',outfit_id:fields.event?(outfit.value||null):null,outfit_text:fields.event?(chosen?`${chosen.name} · ${chosen.description}`:outfit.value?outfit.selectedOptions[0].textContent:''):'',mix_mode:'',checklist,file_path:null,file_name:null,file_mime:null};
    if(noticeContext)payload.event_context=noticeContext;
    let savedEventId='';
    if(['evento','tenida'].includes(kind)){
     if(editingEvent&&!chosen&&!outfit.value&&!clearOutfitRequested)payload.outfit_text=editingEvent.outfit_text||'';
     const departure=String(data.get('departure_at')||'');payload.event_details={departure_at:departure?chileISO(departure):null,meeting_point:String(data.get('meeting_point')||''),official_event_id:editingEvent?.event_details?.official_event_id||eventForKey(publicationEventKey)?.event_details?.official_event_id||String(data.get('official_event_id')||'')||null,category:String(data.get('event_category')||'tocata'),status:String(data.get('event_status')||'confirmado'),outfit_slug:chosen?.id||null};
     const eventPayments=members.filter(m=>!recipients.length||recipients.includes(m[0])).filter(m=>String(data.get(`payment_${m[0]}`)||'').trim()!=='').map(m=>({member_email:m[0],amount_clp:Number(data.get(`payment_${m[0]}`))}));
     if(eventPayments.some(p=>!Number.isSafeInteger(p.amount_clp)||p.amount_clp<0||p.amount_clp>100000000))throw new Error('Revisa los pagos: ingresa pesos enteros entre 0 y 100.000.000.');
     savedEventId=check(await supabase.rpc(editingEvent?'update_intranet_event':'publish_intranet_event',editingEvent?{target_id:editingEvent.id,expected_revision:editingEvent.revision||1,payload,payments:eventPayments}:{payload,payments:eventPayments}));
    }else check(await supabase.from('intranet_entries').insert(payload));
    const returnKey=publicationEventKey||(savedEventId?(payload.event_details?.official_event_id?'official:'+payload.event_details.official_event_id:'entry:'+savedEventId):'');published=true;resetPublication();form.reset();clearMusic();document.querySelectorAll('[data-outfit-slug]').forEach(b=>b.setAttribute('aria-pressed','false'));$('outfit-choice').textContent='Ninguna tenida seleccionada.';updateFields();await load();if(returnKey)openEvent(returnKey);$('status').textContent='Publicado. Los destinatarios verán el nuevo aviso en su intranet.';
   }catch(e:any){$('publish-status').textContent=e.message||'No se pudo guardar.';if(path&&!published)await supabase.storage.from('intranet').remove([path]);message(e);}finally{button.disabled=false;}
  });
 }
 try {
 const catalogue=(supabase as any).previewCatalogue||await catalogueRequest();
 setupLibrary(catalogue,member[2]==='director');refreshPublisher();
 }catch(e){message(e);}
 if(member[2]==='director')$('musical-plan-form').addEventListener('submit',async(event)=>{event.preventDefault();const button=$('save-musical-plan') as HTMLButtonElement;button.disabled=true;try{const payload={target:($('music-target') as HTMLSelectElement).value,music:selectedMusic(),general_notes:($('musical-notes') as HTMLTextAreaElement).value};if(!payload.target)throw new Error('Selecciona un evento o ensayo.');if((supabase as any).previewCatalogue)check(await supabase.rpc('save_intranet_musical_plan',payload));else{const response=await fetch('/api/intranet/musical-plan',{method:'POST',headers:await headers(),body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error);}await load();$('musical-save-status').textContent='Setlist guardado. Complementa la ficha y los destinatarios recibirán un aviso.';}catch(error:any){$('musical-save-status').textContent=error.message;}finally{button.disabled=false;}});
 await load();const requestedEvent=new URLSearchParams(location.hash.slice(1)).get('evento');if(requestedEvent)openEvent(requestedEvent,false);window.addEventListener('hashchange',()=>{const key=new URLSearchParams(location.hash.slice(1)).get('evento');if(key)openEvent(key,false);else if(filter==='event')openSection('agenda');});window.setInterval(()=>{if(!document.hidden && !document.activeElement?.matches('input,textarea,select') && !document.querySelector('#feed details[open]') && !Array.from(document.querySelectorAll('audio')).some(a=>!a.paused))void load();},30000);
}
async function headers() {
 const {data:{session}}=await liveSupabase.auth.getSession();
 if(!session)throw new Error('La sesión expiró. Vuelve a ingresar.');
 return {Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'};
}
async function officialAgendaRequest(){const response=await fetch('/api/intranet/agenda',{headers:await headers(),cache:'no-store'});if(!response.ok)throw new Error('Agenda no disponible');return (await response.json()).events;}
async function catalogueRequest(){const response=await fetch('/api/intranet/catalog',{headers:await headers()});if(!response.ok)throw new Error('No se pudo cargar la biblioteca.');return response.json();}
function draftPlan(data:FormData){
 const start=String(data.get('starts_at'));const departure=String(data.get('departure_at')||'');const target=String(data.get('pdf_for_member')||user.email);const amount=String(data.get(`payment_${target}`)||'');const chosen=outfitFor(String(data.get('outfit_slug')));
 const draftKind=($('kind') as HTMLSelectElement).value;const draftOfficialId=editingEvent?.event_details?.official_event_id||eventForKey(publicationEventKey)?.event_details?.official_event_id||String(data.get('official_event_id')||'');const draftOfficial=officialEvents.find(e=>String(e.id)===draftOfficialId);
 const plan={kind:draftKind,title:String(data.get('title')||'Plan del evento'),body:String(data.get('body')||''),starts_at:start?chileISO(start):null,location:String(data.get('location')||''),recipients:editingEvent?.recipients||data.getAll('recipients').map(String),music:currentRole==='director'&&draftKind==='personal'?selectedMusic():[],internal_work:String(data.get('internal_work')||''),event_details:{departure_at:departure?chileISO(departure):null,meeting_point:String(data.get('meeting_point')||''),official_event_id:draftOfficialId||null,category:String(data.get('event_category')||'tocata'),status:String(data.get('event_status')||'confirmado'),outfit_slug:chosen?.id||null},outfit_text:chosen?chosen.name:editingEvent&&!clearOutfitRequested?editingEvent.outfit_text||'':'',checklist:String(data.get('checklist')||'').split('\n').map(t=>t.trim()).filter(Boolean),member_email:target,payment_amount:amount!==''?Number(amount):null};
 return draftOfficial&&['evento','tenida'].includes(plan.kind)?officialAgenda([draftOfficial],[plan])[0]:plan;
}
async function getPlanPdf(plan:any){
 const preview=import.meta.env.DEV && Boolean((supabase as any).previewCatalogue);
 const payload=plan.id&&!preview?{entryId:plan.id}: {...plan,music:plan.rehearsal?.music||plan.music,personal_checklist:receipts.find(r=>r.entry_id===plan.id)?.personal_checklist||[],completed:receipts.find(r=>r.entry_id===plan.id)?.completed||[],payment_amount:plan.id?payments.find(p=>p.entry_id===plan.id)?.amount_clp:plan.payment_amount,member_email:plan.member_email||user.email,preview};
 const response=await fetch('/api/intranet/rehearsal-pdf',{method:'POST',headers:preview?{'Content-Type':'application/json'}:await headers(),body:JSON.stringify(payload)});
 if(!response.ok){const result=await response.json();throw new Error(result.error||'No se pudo generar el PDF.');}
 const url=URL.createObjectURL(await response.blob());const link=document.createElement('a');link.href=url;link.download=['evento','tenida'].includes(plan.kind)?'consolidado-evento-banda-bruna.pdf':'plan-musical-banda-bruna.pdf';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
async function start() {
 if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) {
  const { createPreview } = await import('./preview');
  supabase = createPreview();
 }
 await init();
}
void start().catch(message);
