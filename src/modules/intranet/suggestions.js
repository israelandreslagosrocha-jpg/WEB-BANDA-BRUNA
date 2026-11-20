import {escapeHtml as esc} from '../../utils/escapeHtml.js';
import {isPastActivity} from './lifecycle.js';
import {musicTarget} from './workflow.js';
export function managementSuggestions(entries,role,now=new Date()){
 if(!['jefatura','director'].includes(role))return '';
 const future=entries.filter(e=>e.starts_at&&!isPastActivity(e,entries,[],now)).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 const cards=[];
 for(const e of future){
  const when=new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'long'}).format(new Date(e.starts_at));
  const key=esc(musicTarget(e));
  if(role==='jefatura'&&['evento','tenida'].includes(e.kind)){
   const missing=[(!e.location||e.official_only)&&'datos del lugar',(!e.starts_at||e.all_day)&&'hora del show',!e.event_details?.departure_at&&'horario de salida',!(e.outfit_text||e.event_details?.outfit_slug)&&'tenida',(!e.body||e.official_only)&&'indicaciones',!e.checklist?.length&&'preparativos'].filter(Boolean);
   if(missing.length)cards.push(`<article><h3>${esc(e.title)} · ${esc(when)}</h3><p>Tienes un próximo evento. ¿Quieres definir ahora la organización?</p><p class="suggestion-missing">Falta completar: ${esc(missing.join(', '))}.</p><button data-suggest-edit="${key}">Definir organización y tenida</button></article>`);
  }
  if(role==='director'&&!e.rehearsal?.music?.length)cards.push(`<article><h3>${esc(e.title)} · ${esc(when)}</h3><p>Tienes un ${e.kind==='ensayo'?'ensayo':'evento'} próximo sin setlist. ¿Quieres prepararlo ahora?</p><button data-suggest-music="${key}">Definir setlist de esta fecha</button></article>`);
 }
 if(!future.some(e=>e.kind==='ensayo'))cards.push(role==='jefatura'?'<article><h3>¿Cuándo será el próximo ensayo?</h3><p>No hay una fecha de ensayo programada. Propón fecha, hora y lugar para que Vicente pueda preparar el setlist.</p><button data-suggest-rehearsal>Proponer fecha de ensayo</button></article>':'<article><h3>El próximo ensayo aún no tiene fecha</h3><p>Pide a Jaime o César que propongan fecha, hora y lugar. Después podrás armar el setlist para ese ensayo.</p><button data-suggest-request>Preparar solicitud a Jaime y César</button></article>');
 return cards.length?`<h2>Pendientes para preparar al equipo</h2><p>Completa lo que falta para las próximas fechas.</p>${cards.join('')}`:'<h2>Próximas fechas preparadas</h2><p>No tienes información pendiente de completar para tu perfil.</p>';
}
