import { escapeHtml as esc } from '../../utils/escapeHtml.js';
import { musicTarget } from './workflow.js';
import { outfitFor } from './outfits.js';
export function eventActions(e,role,compact=false){
 const key=esc(musicTarget(e));const event=['evento','tenida'].includes(e.kind);
 const open=compact?`<button class="event-open-action" data-open-event="${key}">Abrir ficha ${event?'del evento':'del ensayo'} →</button>`:'';
 if(role==='jefatura'&&event)return `${open}<div class="event-actions ${compact?'is-compact':''}"><button data-edit-event="${key}"><strong>${e.official_only?'Completar ficha':'Editar datos'}</strong>${compact?'':'<span>Fecha, lugar, horarios, salida, pagos y preparativos</span>'}</button><button data-edit-event="${key}" data-edit-outfit="true"><strong>Elegir tenida</strong>${compact?'':'<span>Seleccionar o cambiar la vestimenta de esta fecha</span>'}</button><button data-event-notice="${key}"><strong>Enviar comunicado</strong>${compact?'':'<span>Mensaje vinculado a este evento y a sus destinatarios</span>'}</button></div>`;
 if(role==='director')return `${open}<div class="event-actions"><button class="setlist-edit-action" data-edit-music-target="${key}">${e.rehearsal?.music?.length?'Editar setlist':'Agregar setlist'}</button></div>`;
 return open;
}
export function eventChecklist(e){
 const items=[['Fecha',!!e.starts_at],['Lugar',!!e.location],['Hora del evento',!!e.starts_at&&!e.all_day],['Horario de salida',!!e.event_details?.departure_at],['Tenida',!!(outfitFor(e.event_details?.outfit_slug)||e.outfit_text)],['Consideraciones',!!e.body],['Preparativos',!!e.checklist?.length],['Setlist · Vicente',!!e.rehearsal?.music?.length]];
 return `<div class="event-progress" aria-label="Información de la ficha">${items.map(([label,ready])=>`<span class="${ready?'is-ready':'is-pending'}">${esc(label)} · ${ready?'Definido':'Por definir'}</span>`).join('')}</div>`;
}
export function eventPage(e,role,detail,notices=[]){
 const event=['evento','tenida'].includes(e.kind);
 return `<section class="event-screen"><p class="eyebrow">${event?'FICHA DEL EVENTO':'FICHA DEL ENSAYO'}</p><h2>${esc(e.title)}</h2><p>${role==='jefatura'&&event?'Gestiona esta fecha desde sus acciones. Los cambios se guardan en la misma ficha; Vicente conserva el control del setlist.':role==='director'?'Consulta la logística de jefatura y agrega o edita el setlist de esta misma fecha.':'Revisa la información de esta fecha, descarga tu PDF y prepara tu checklist personal.'}</p>${eventActions(e,role)}${event?eventChecklist(e):''}${detail(e)}${e.related_entries?.length?`<details class="event-notices"><summary>Otros avisos vinculados a esta fecha</summary>${e.related_entries.map(n=>detail(n)).join('')}</details>`:''}${notices.length?`<section class="event-notices"><h3>Comunicados de este evento</h3>${notices.map(n=>detail(n)).join('')}</section>`:'<p class="music-note">No hay comunicados asociados a esta fecha.</p>'}</section>`;
}
