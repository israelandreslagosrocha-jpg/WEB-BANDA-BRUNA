import assert from 'node:assert/strict';
import {publicationKinds,publicationFields,complementMusic,musicTarget,pendingText} from '../src/modules/intranet/workflow.js';
assert.deepEqual(publicationKinds('jefatura'),['comunicado','evento','ensayo','personal']);assert.ok(!publicationKinds('director').includes('evento'));
for(const role of ['jefatura','director']){
 assert.equal(publicationFields(role,'comunicado').schedule,false);assert.equal(publicationFields(role,'comunicado').music,false);assert.equal(publicationFields(role,'personal').event,false);assert.equal(publicationFields(role,'ensayo').event,false);
}
assert.equal(publicationFields('jefatura','evento').music,false);assert.equal(publicationFields('director','personal').music,true);assert.equal(publicationFields('director','evento').event,false);
const logistics={id:'event-1',kind:'evento',author_email:'cesarbruna@bandabruna.cl',location:'Teatro',event_details:{outfit_slug:'azul-gala'},rehearsal:{music:[{id:'viking-1'}]}};
let combined=complementMusic([logistics],[])[0];assert.equal(combined.rehearsal.music.length,0);assert.equal(combined.setlist_pending,true);assert.match(pendingText(combined),/Vicente/);
const selected=[{id:'antonio-rios',purpose:'show',mode:'bruto',notes:'Solo tres canciones'}];
combined=complementMusic([logistics],[{target_key:'entry:event-1',music:selected,general_notes:'Revisar cortes',updated_at:'2026-11-01T20:00:00Z'}])[0];
assert.deepEqual(combined.rehearsal.music,selected);assert.equal(combined.location,'Teatro');assert.equal(combined.event_details.outfit_slug,'azul-gala');assert.equal(combined.musical_notes,'Revisar cortes');assert.equal(combined.setlist_pending,false);
const official={...logistics,event_details:{...logistics.event_details,official_event_id:'show-1'}};assert.equal(musicTarget(official),'official:show-1');
assert.equal(complementMusic([official],[{target_key:'entry:another',music:selected}])[0].setlist_pending,true);
assert.equal(complementMusic([official],[{target_key:'official:show-1',music:selected}])[0].setlist_pending,false);
console.log('OK: formularios por tipo, setlist exclusivo de dirección, fichas complementadas y tenida conservada.');
