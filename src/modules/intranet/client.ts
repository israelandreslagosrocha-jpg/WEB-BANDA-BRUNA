import { officialAgenda } from './officialAgenda';
import { agendaView, rehearsalView, dayKey } from './schedule';
import { setupPush } from './pushClient';
import { outfitFor } from './outfits';
import { setupLibrary, selectedMusic, clearMusic, musicSummary } from './library';
import { chileISO } from './time';
import { supabase as liveSupabase } from '../../services/supabaseClient';
let supabase: any = liveSupabase;
import { members, memberFor } from './members';
import { escapeHtml as esc } from '../../utils/escapeHtml';
const $ = (id: string) => document.getElementById(id)!;
let officialEvents:any[]=[],officialError='';
let user: any, entries: any[] = [], receipts: any[] = [], payments: any[] = [], filter = '', busy = false;
const rehearsalLabels: Record<string,string> = {internal_work:'Trabajo interno y participantes',next_rehearsal:'Próximo ensayo',show_setlist:'Repertorio del próximo show',new_songs:'Canciones nuevas'};
const kinds: Record<string,string> = {comunicado:'Comunicado',evento:'Evento',ensayo:'Ensayo',repertorio:'Repertorio',cancion:'Canción / mix',personal:'Indicación personal',tenida:'Tenida para evento'};
function check(result: any) { if (result.error) throw result.error; return result.data; }
function message(error: any) { $('status').textContent = `No se pudo completar: ${error.message || error}. Si la intranet aún no está habilitada, falta aplicar su configuración en Supabase.`; }
function date(value: string,allDay=false) {return new Intl.DateTimeFormat('es-CL',{dateStyle:'full',...(allDay?{}:{timeStyle:'short' as const}),timeZone:'America/Santiago'}).format(new Date(value))+(allDay?' · Hora por confirmar':'');}
async function load() {
 if(busy) return; busy=true;
 try {
  const [a,b,c] = await Promise.all([supabase.from('intranet_entries').select('*').order('created_at',{ascending:false}),supabase.from('intranet_receipts').select('*').eq('user_id',user.id),supabase.from('intranet_event_payments').select('*').eq('member_email',user.email.toLowerCase())]);
  entries=check(a)||[]; receipts=check(b)||[]; payments=check(c)||[];
  try{officialEvents=(supabase as any).previewOfficialEvents||await officialAgendaRequest();officialError='';}catch{officialError='No se pudo actualizar la agenda oficial. Se muestran los avisos internos; pulsa Actualizar avisos para reintentar.';}
  const officialSelect=$('official-event') as HTMLSelectElement;const oldSelection=officialSelect.value;officialSelect.innerHTML='<option value="">Actividad independiente</option>'+officialEvents.map(e=>`<option value="${esc(e.id)}">${esc(e.fecha)} · ${esc(e.nombre)}</option>`).join('');officialSelect.value=oldSelection;
  render(); $('status').textContent=officialError;
 } catch(e) {message(e);} finally {busy=false;}
}
function openSection(next: string) {
 filter=next;
 $('section-picker').hidden=true;
 $('section-content').hidden=false;
 $('feed-section').hidden=next==='publish';
 $('publisher').hidden=next!=='publish';
 $('repertoire-library').hidden=next!=='material';
 $('section-title').textContent=({todos:'Toda la información',pendientes:'Avisos sin leer',agenda:'Agenda',ensayo:'Ensayos',material:'Material',personal:'Para mí',publish:'Enviar información'} as Record<string,string>)[next] || 'Tu información';
 render();
 $('section-title').focus({preventScroll:true});
 $('section-content').scrollIntoView({behavior:'smooth',block:'start'});
}
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
 if(e.official_only)return `<article class="entry"><h2>${esc(e.title)}</h2><p>${esc(e.location)}</p><p>Fecha de la agenda oficial: ${esc(e.official_date)}. Horario de tocata por confirmar.</p><p>Jefatura puede asociar la tenida, setlist y ficha interna al seleccionar esta fecha al publicar.</p><a href="/agenda" target="_blank" rel="noopener">Ver agenda oficial ↗</a></article>`;
 const receipt=receipts.find(r=>r.entry_id===e.id); const author=memberFor(e.author_email)?.[1]||e.author_email;
 return `<article class="entry"><p class="entry-meta">${esc(kinds[e.kind])} · ${esc(author)} · ${esc(date(e.created_at))}${e.recipients.length?' · Privado':''}</p><h2>${esc(e.title)}</h2>${e.starts_at?`<p>${esc(date(e.starts_at,e.all_day))}</p>`:''}${e.location?`<p>📍 ${esc(e.location)}</p>`:''}<p class="entry-body">${esc(e.body)}</p>${Object.entries(rehearsalLabels).filter(([key])=>e.rehearsal?.[key]).map(([key,label])=>`<h3>${esc(label)}</h3><p class="entry-body">${esc(e.rehearsal[key])}</p>`).join('')}${eventMarkup(e,receipt)}${musicSummary(e.rehearsal?.music||[])}${e.rehearsal?.music?.length||['evento','tenida'].includes(e.kind)?`<button data-plan-pdf="${e.id}">${['evento','tenida'].includes(e.kind)?'↓ Descargar mi consolidado del evento':'↓ Descargar PDF del plan'}</button>`:''}${e.outfit_text?`<p>Tenida: ${esc(e.outfit_text)}</p>`:''}${e.mix_mode?`<p>Mix: ${esc(e.mix_mode)}</p>`:''}${e.checklist.map((item:string,i:number)=>`<label><input type="checkbox" data-entry="${e.id}" data-index="${i}" ${receipt?.completed.includes(i)?'checked':''}/> ${esc(item)}</label>`).join('')}${e.file_path?`<button data-file="${e.id}">Abrir / descargar ${esc(e.file_name||'archivo')}</button><div id="file-${e.id}"></div>`:''}<button data-read="${e.id}" ${receipt?.read_at?'disabled':''}>${receipt?.read_at?'✓ Leído':'Marcar como leído'}</button></article>`;
 };
 if(filter==='agenda'){$('feed').innerHTML=agendaView(officialAgenda(officialEvents,visible),{year:calendarYear,month:calendarMonth,selectedDay:calendarDay},(e:any)=>detail(e)+(e.related_entries||[]).map(detail).join(''));return;}
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
 const adminLink=document.querySelector<HTMLAnchorElement>('a[href="/admin/dashboard"]'); if(adminLink)adminLink.hidden=user.email.toLowerCase()!=='contacto@bandabruna.cl';
 $('identity').textContent=`${member[1]} · ${member[2]==='director'?'Dirección musical':member[2]==='jefatura'?'Jefatura':'Integrante'}`;
 $('workspace').hidden=false;
 const stopPush=await setupPush(supabase,Boolean((supabase as any).previewCatalogue));
 $('logout').onclick=async()=>{try{await stopPush?.();}catch{ $('status').textContent='No se pudo desactivar este dispositivo. Reintenta antes de cerrar sesión.';return;}await supabase.auth.signOut();location.href='/admin';};
 $('refresh').onclick=load;
 document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(button=>button.onclick=()=>openSection(button.dataset.filter!));
 $('back-sections').onclick=()=>{filter='';$('section-picker').hidden=false;$('section-content').hidden=true;$('section-picker').scrollIntoView({behavior:'smooth',block:'start'});};
 $('feed').addEventListener('click',async(event)=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button'); if(!button)return;
  if(button.hasAttribute('data-month-step')){const d=new Date(calendarYear,calendarMonth+Number(button.dataset.monthStep),1);calendarYear=d.getFullYear();calendarMonth=d.getMonth();calendarDay='';render();return;}
  if(button.hasAttribute('data-calendar-today')){const parts=dayKey(new Date()).split('-').map(Number);calendarYear=parts[0];calendarMonth=parts[1]-1;calendarDay='';render();return;}
  if(button.dataset.calendarDay){calendarDay=button.dataset.calendarDay;render();return;}
  if(button.hasAttribute('data-calendar-clear')){calendarDay='';render();return;}
  try {
   button.disabled=true;
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
  $('open-publisher').hidden=false;
  $('open-publisher').onclick=()=>openSection('publish');
  $('kind').innerHTML=Object.entries(kinds).filter(([k])=>member[2]==='jefatura'||['ensayo','repertorio','cancion','personal'].includes(k)).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  const updateFields=()=>{const kind=($('kind') as HTMLSelectElement).value;const event=member[2]==='jefatura'&&['evento','tenida'].includes(kind);$('event-fields').hidden=!event;$('event-pdf-options').hidden=!event;$('outfit-fields').hidden=!event;$('rehearsal-fields').hidden=!['ensayo','repertorio','cancion','personal'].includes(kind);};
  $('kind').onchange=updateFields; updateFields();
  $('official-event').onchange=()=>{const event=officialEvents.find(e=>String(e.id)===($('official-event') as HTMLSelectElement).value);if(!event)return;const form=$('publish-form') as HTMLFormElement;const start=form.elements.namedItem('starts_at') as HTMLInputElement;if(start.value.split('T')[1])start.value=event.fecha+'T'+start.value.split('T')[1];$('official-date-hint').textContent=`Fecha oficial: ${event.fecha}. Completa la hora de tocata para la ficha.`;(form.elements.namedItem('location') as HTMLInputElement).value=[event.lugar,event.ciudad].filter(Boolean).join(' · ');(form.elements.namedItem('title') as HTMLInputElement).value=event.nombre;};
  $('draft-music-pdf').onclick=async()=>{const form=$('publish-form') as HTMLFormElement;try{$('pdf-status').textContent='Preparando PDF…';await getPlanPdf(draftPlan(new FormData(form)));$('pdf-status').textContent='PDF descargado.';}catch(e:any){$('pdf-status').textContent=e.message;}};
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
    const recipients=data.getAll('recipients').map(String);const kind=String(data.get('kind'));
    if(kind==='personal' && recipients.length!==1)throw new Error('Selecciona exactamente un destinatario para la indicación personal.');
    const start=String(data.get('starts_at'));const linkedOfficial=['evento','tenida'].includes(kind)?officialEvents.find(e=>String(e.id)===String(data.get('official_event_id'))):null;const starts_at=start?chileISO(linkedOfficial?linkedOfficial.fecha+'T'+start.split('T')[1]:start):null;
    const checklist=String(data.get('checklist')).split('\n').map(v=>v.trim()).filter(Boolean);if(checklist.length>50)throw new Error('El checklist admite hasta 50 puntos.');
    const file=data.get('file') as File;
    if(file?.size){if(file.size>52428800)throw new Error('El archivo supera 50 MB.');path=`${user.id}/${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;check(await supabase.storage.from('intranet').upload(path,file));}
    const outfit=$('outfits') as HTMLSelectElement;
    const chosen=outfitFor(String(data.get('outfit_slug')));
    if(kind==='tenida'&&(!(outfit.value||chosen)||!starts_at||!String(data.get('location')).trim()))throw new Error('Selecciona tenida, fecha y evento.');
    const payload:any={kind,title:String(data.get('title')).trim(),body:String(data.get('body')),recipients,starts_at,rehearsal:{...Object.fromEntries(Object.keys(rehearsalLabels).map(key=>[key,String(data.get(key)||'')])),music:selectedMusic(),catalog_version:'2026-11-01'},location:String(data.get('location')),outfit_id:outfit.value||null,outfit_text:chosen?`${chosen.name} · ${chosen.description}`:outfit.value?outfit.selectedOptions[0].textContent:'',mix_mode:data.get('mix_mode'),checklist,file_path:path,file_name:file?.size?file.name:null,file_mime:file?.size?file.type:null};
    if(['evento','tenida'].includes(kind)){
     const departure=String(data.get('departure_at')||'');payload.event_details={departure_at:departure?chileISO(departure):null,meeting_point:String(data.get('meeting_point')||''),official_event_id:String(data.get('official_event_id')||'')||null,category:String(data.get('event_category')||'tocata'),status:String(data.get('event_status')||'confirmado'),outfit_slug:chosen?.id||null};
     const eventPayments=members.filter(m=>!recipients.length||recipients.includes(m[0])).filter(m=>String(data.get(`payment_${m[0]}`)||'').trim()!=='').map(m=>({member_email:m[0],amount_clp:Number(data.get(`payment_${m[0]}`))}));
     if(eventPayments.some(p=>!Number.isSafeInteger(p.amount_clp)||p.amount_clp<0||p.amount_clp>100000000))throw new Error('Revisa los pagos: ingresa pesos enteros entre 0 y 100.000.000.');
     check(await supabase.rpc('publish_intranet_event',{payload,payments:eventPayments}));
    }else check(await supabase.from('intranet_entries').insert(payload));
    published=true;form.reset();clearMusic();document.querySelectorAll('[data-outfit-slug]').forEach(b=>b.setAttribute('aria-pressed','false'));$('outfit-choice').textContent='Ninguna tenida seleccionada.';updateFields();await load();$('status').textContent='Publicado. Los destinatarios verán el nuevo aviso en su intranet.';
   }catch(e){if(path&&!published)await supabase.storage.from('intranet').remove([path]);message(e);}finally{button.disabled=false;}
  });
 }
 try {
 const catalogue=(supabase as any).previewCatalogue||await catalogueRequest();
 setupLibrary(catalogue,member[2]!=='miembro');
 }catch(e){message(e);}
 await load();window.setInterval(()=>{if(!document.hidden && !document.activeElement?.matches('input,textarea,select') && !document.querySelector('#feed details[open]') && !Array.from(document.querySelectorAll('audio')).some(a=>!a.paused))void load();},30000);
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
 const draftOfficial=officialEvents.find(e=>String(e.id)===String(data.get('official_event_id')));
 const plan={kind:String(data.get('kind')),title:String(data.get('title')||'Plan del evento'),body:String(data.get('body')||''),starts_at:start?chileISO(start):null,location:String(data.get('location')||''),recipients:data.getAll('recipients').map(String),music:selectedMusic(),internal_work:String(data.get('internal_work')||''),event_details:{departure_at:departure?chileISO(departure):null,meeting_point:String(data.get('meeting_point')||''),official_event_id:String(data.get('official_event_id')||'')||null,category:String(data.get('event_category')||'tocata'),status:String(data.get('event_status')||'confirmado'),outfit_slug:chosen?.id||null},outfit_text:chosen?chosen.name:'',checklist:String(data.get('checklist')||'').split('\n').map(t=>t.trim()).filter(Boolean),member_email:target,payment_amount:amount!==''?Number(amount):null};
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
