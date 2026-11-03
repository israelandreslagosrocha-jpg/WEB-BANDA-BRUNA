import assert from 'node:assert/strict';
import { canDeleteEntry, deleteEntryButton } from '../src/modules/intranet/deletion.js';
const user={id:'creator'};
for(const kind of ['comunicado','personal','ensayo']) {
 const item={id:'sample',kind,author:user.id};
 assert(canDeleteEntry(item,user));
 assert(!canDeleteEntry(item,{id:'another'}));
 assert(!canDeleteEntry(item,null));
 assert(deleteEntryButton(item,user).includes('data-delete-entry'));
 assert.equal(deleteEntryButton(item,{id:'another'}),'');
 assert(!canDeleteEntry({...item,event_details:{official_event_id:'official'}},user));
}
for(const kind of ['evento','tenida','repertorio','cancion'])assert(!canDeleteEntry({kind,author:user.id},user));
console.log('OK: solo el autor puede borrar comunicados, indicaciones y ensayos; eventos protegidos.');
const {rehearsalView}=await import('../src/modules/intranet/schedule.js');
const sample={id:'sample',author:user.id,kind:'ensayo',title:'Ensayo propio',starts_at:'2026-11-04T23:00:00Z',location:'Sala',rehearsal:{}};
const table=rehearsalView([sample],[],()=>'<p>Detalle</p>',entry=>deleteEntryButton(entry,user));
assert(table.indexOf('data-delete-entry')<table.indexOf('<details class="plan-details'));
assert(!rehearsalView([sample],[],()=>'',entry=>deleteEntryButton(entry,{id:'another'})).includes('data-delete-entry'));
console.log('OK: borrar visible en la tabla de ensayo sin expandir detalles; oculto a otro integrante.');
