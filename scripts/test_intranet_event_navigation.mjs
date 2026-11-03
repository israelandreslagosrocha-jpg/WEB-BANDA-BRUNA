import assert from 'node:assert/strict';
import { agendaView } from '../src/modules/intranet/schedule.js';
import { eventActions,eventPage } from '../src/modules/intranet/eventPage.js';
const event={id:'event-1',kind:'evento',title:'Show <seguro>',starts_at:'2026-11-07T22:00:00Z',event_details:{},checklist:[],rehearsal:{music:[]}};
const html=agendaView([event],{year:2026,month:10},()=>'', 'jefatura');
assert.match(html,/data-open-event="entry:event-1"/);assert.match(html,/data-edit-event/);assert.match(html,/data-event-notice/);assert.match(html,/Show &lt;seguro&gt;/);assert.ok(!html.includes('<button class="calendar-day'));
for(const role of ['miembro','director']){const actions=eventActions(event,role);assert.ok(!actions.includes('data-edit-event'));assert.ok(!actions.includes('data-event-notice'));assert.equal(actions.includes('data-edit-music-target'),role==='director');}
assert.match(eventActions({...event,official_only:true,event_details:{official_event_id:'show-1'}},'jefatura'),/official:show-1/);
assert.match(eventPage(event,'jefatura',()=>'<p>Ficha</p>',[]),/Fecha, lugar, horarios, salida, pagos y preparativos/);
console.log('OK: acceso a ficha desde calendario y lista; acciones por rol y fechas oficiales.');
