import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { catalogue,findMusic,validateMusic,downloadAudioUrl } from '../src/modules/intranet/catalog.js';
import { rehearsalPdf } from '../src/modules/intranet/rehearsalPdf.js';
const ids=catalogue.items.flatMap(i=>[i.id,...i.tracks.map(t=>t.id)]);
assert.equal(new Set(ids).size,ids.length);
assert.equal(catalogue.items.filter(i=>i.section==='viking').reduce((s,i)=>s+i.tracks.length,0),45);
assert.deepEqual(findMusic('antonio-rios').tracks.map(t=>t.title),['Quisiera recorrer tu cuerpo','Amigo mío','Nunca me faltes']);
assert.equal(findMusic('viking-valpo-07').key,'Dm > Bb > A7 · Dm');
assert.equal(findMusic('viking-valpo-07').parentId,'viking-valpo');
assert.deepEqual(catalogue.items.filter(i=>!i.audio).map(i=>i.id),[]);
assert.equal(catalogue.items.filter(i=>i.audio?.verified).length,37);
assert.throws(()=>validateMusic([{id:'invalid',purpose:'ensayo',mode:'bruto',notes:''}]));
const music=[{id:'viking-1',purpose:'ensayo',mode:'secuencia',notes:'Revisar entradas y cortes. Trabajar la transición a Magic Woman.'},{id:'viking-valpo-07',purpose:'personal',mode:'bruto',notes:'Practicar Macondo con metrónomo. Escuchar el audio del mix como referencia.'},{id:'antonio-rios',purpose:'nuevo',mode:'por-confirmar',notes:'Solo las tres canciones seleccionadas. Confirmar la versión del audio.'}];
assert.throws(()=>validateMusic([music[0],music[0]]));
assert.throws(()=>validateMusic([{...music[0],notes:'a'.repeat(5001)}]));
assert.match(downloadAudioUrl(findMusic('viking-1').audio),/\/fl_attachment\//);
assert.ok(downloadAudioUrl(findMusic('luna-amiga').audio).endsWith('.mp3'));
const pdf=await rehearsalPdf({title:'Plan de ensayo · Banda Bruna',author:'Vicente Núñez',starts_at:'2026-11-04T23:00:00Z',location:'Sala de ensayo',recipients:[],body:'Ejemplo de un plan armado seleccionando temas del catálogo, con tonalidades e indicaciones por selección.',music});
assert.equal(pdf.subarray(0,4).toString(),'%PDF');
if (!process.argv.includes('--no-write')) {
await fs.mkdir('output/pdf',{recursive:true});await fs.writeFile('output/pdf/ejemplo-plan-ensayo-bruna.pdf',pdf);
}
console.log('OK: IDs únicos, 45 temas Viking, tres temas Antonio Ríos, 37 MP3, sin audios pendientes, validación y PDF.');
