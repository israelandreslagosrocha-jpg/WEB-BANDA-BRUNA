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
