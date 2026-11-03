import { escapeHtml as esc } from '../../utils/escapeHtml.js';
export function pdfDownloadButton(entry, compact=false){
 if(entry.official_only)return '';
 const event=['evento','tenida'].includes(entry.kind);
 const label=event?'Descargar mi ficha del evento':entry.kind==='ensayo'?'Descargar plan de ensayo':'Descargar plan musical';
 return `<div class="pdf-download ${compact?'pdf-download-compact':''}"><button type="button" class="pdf-action" data-plan-pdf="${esc(entry.id)}" aria-label="${esc(label)} en PDF: ${esc(entry.title)}"><span class="pdf-badge" aria-hidden="true">PDF</span><span>${label}<small>Archivo PDF · guardar o imprimir</small></span><span aria-hidden="true">↓</span></button>${compact?'':`<p>${event?'Fecha, horarios, tenida, indicaciones, mi pago y checklist.':'Fecha, hora, lugar, setlist e indicaciones de Vicente.'}${entry.setlist_pending?' El setlist se incorporará cuando Vicente lo publique.':''}</p>`}</div>`;
}
export const publicationCopy={
 comunicado:{title:'Enviar comunicado',description:'Escribe el mensaje y elige quién lo recibirá. No requiere fecha, tenida ni setlist.',subject:'Asunto del comunicado',submit:'Enviar comunicado y notificar'},
 evento:{title:'Crear evento',description:'Jaime y César definen fecha, lugar, horarios y tenida. Vicente completará el setlist desde Dirección musical.',subject:'Nombre del evento',submit:'Publicar evento y notificar'},
 ensayo:{title:'Programar ensayo',description:'Define fecha, hora, lugar y destinatarios. Vicente completa el setlist desde Dirección musical.',subject:'Nombre del ensayo',submit:'Publicar ensayo y notificar'},
 personal:{title:'Enviar indicación personal',description:'Selecciona a una sola persona y escribe su indicación.',subject:'Asunto de la indicación',submit:'Enviar indicación personal y notificar'}
};
