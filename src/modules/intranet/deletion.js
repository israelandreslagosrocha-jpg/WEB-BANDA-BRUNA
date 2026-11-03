import { escapeHtml as esc } from '../../utils/escapeHtml.js';
export function canDeleteEntry(entry,user){
 return !!user?.id && entry.author===user.id && ['comunicado','personal','ensayo'].includes(entry.kind) && !entry.official_only && !entry.event_details?.official_event_id;
}
export function deleteEntryButton(entry,user){
 return canDeleteEntry(entry,user)?`<button class="delete-entry-action" data-delete-entry="${esc(entry.id)}">Borrar ${entry.kind==='ensayo'?'ensayo':entry.kind==='personal'?'indicación':'comunicado'}</button>`:'';
}
