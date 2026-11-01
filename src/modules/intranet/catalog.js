import catalogue from './repertoire.json' with { type: 'json' };
export { catalogue };
export function findMusic(id) {
 for(const item of catalogue.items) {
  if(item.id===id)return {...item,parentId:null};
  const track=item.tracks.find(t=>t.id===id);
  if(track)return {...track,section:item.section,parentId:item.id,parentTitle:item.title,tracks:[],audio:item.audio,mode:item.mode,note:'Referencia al audio del mix completo; no es una pista individual.'};
 }
 return null;
}
export function downloadAudioUrl(audio) {
 if(!audio)return '';
 const url=new URL(audio.url);
 if(url.hostname!=='res.cloudinary.com'||!url.pathname.startsWith('/dhgifjpkh/video/upload/'))return '';
 url.pathname=url.pathname.replace('/video/upload/','/video/upload/fl_attachment/');
 return url.href;
}
export const musicPurposes = {ensayo:'Próximo ensayo',show:'Próximo show',nuevo:'Canción nueva',personal:'Trabajo personal'};
export function validateMusic(rows) {
 if(!Array.isArray(rows)||rows.length>100)throw new Error('Selecciona hasta 100 temas o mixes.');
 const ids=new Set();
 return rows.map(row=>{
  if(!row||typeof row.id!=='string'||!findMusic(row.id)||ids.has(row.id))throw new Error('La selección contiene temas inválidos o repetidos.');
  ids.add(row.id);
  if(!Object.hasOwn(musicPurposes,row.purpose)||!['por-confirmar','secuencia','bruto','mixto'].includes(row.mode))throw new Error('Revisa el destino y modo de cada tema.');
  if(typeof row.notes!=='string'||row.notes.length>5000)throw new Error('Las indicaciones admiten hasta 5000 caracteres por tema.');
  return {id:row.id,purpose:row.purpose,mode:row.mode,notes:row.notes};
 });
}
