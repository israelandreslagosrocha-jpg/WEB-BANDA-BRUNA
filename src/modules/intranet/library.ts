import { escapeHtml as esc } from '../../utils/escapeHtml';
type Selection={id:string,purpose:string,mode:string,notes:string};
const $=(id:string)=>document.getElementById(id)!;
const normalize=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const purposes:Record<string,string>={ensayo:'Próximo ensayo',show:'Próximo show',nuevo:'Canción nueva',personal:'Trabajo personal'};
const modes:Record<string,string>={'por-confirmar':'Secuencia / bruto: por confirmar',secuencia:'Con secuencia',bruto:'En bruto',mixto:'Mixto'};
let catalogue:any, selected:Selection[]=[], canPublish=false;
export function selectedMusic(){return selected.map(row=>({...row}));}
export function setSelectedMusic(rows:Selection[]){selected=rows.map(r=>({...r}));renderSelection();renderPicker();}
export function clearMusic(){selected=[];renderSelection();renderPicker();}
export function musicItem(id:string){for(const item of catalogue?.items||[]){if(item.id===id)return item;const track=item.tracks.find((t:any)=>t.id===id);if(track)return {...track,parentTitle:item.title,audio:item.audio,tracks:[]};}return null;}
function downloadUrl(audio:any){const url=new URL(audio.url);url.pathname=url.pathname.replace('/video/upload/','/video/upload/fl_attachment/');return url.href;}
function audioMarkup(item:any){return item.audio?`<div class="music-audio"><audio controls preload="none" src="${esc(item.audio.url)}" aria-label="Escuchar ${esc(item.title)}"></audio><a class="file-link" href="${esc(downloadUrl(item.audio))}" target="_blank" rel="noopener">↓ Descargar MP3</a></div>`:'<p class="music-missing">Audio pendiente de agregar a la carpeta.</p>';}
function selectionButton(id:string){return `<button type="button" data-music-add="${esc(id)}" ${selected.some(s=>s.id===id)?'disabled':''}>${selected.some(s=>s.id===id)?'✓ Seleccionado':'+ Agregar al plan'}</button>`;}
function itemMarkup(item:any,picker:boolean){return `<article class="music-item"><div class="music-item-header"><div><h3>${esc(item.title)}</h3><small>${esc(modes[item.mode]||'')}${item.status==='nuevo'?' · Nuevo':item.status==='produccion'?' · Producción / lanzamiento':''}</small></div>${picker?selectionButton(item.id):''}</div>${item.note?`<p class="music-note">${esc(item.note)}</p>`:''}${picker?'':audioMarkup(item)}${item.tracks.length?`<details class="music-tracks"><summary>${item.tracks.length} canciones · ver listado y tonalidades</summary><ol>${item.tracks.map((t:any)=>`<li><div><span>${esc(t.title)}</span> <strong>${esc(t.key||'Tonalidad por confirmar')}</strong></div>${picker?selectionButton(t.id):''}</li>`).join('')}</ol></details>`:''}</article>`;}
function groupedMarkup(query:string,section:string,missing:boolean,picker:boolean){
 const term=normalize(query);const items=catalogue.items.filter((i:any)=>(!section||i.section===section)&&(!missing||!i.audio)&&(!term||normalize([i.title,...i.tracks.map((t:any)=>t.title+' '+t.key)].join(' ')).includes(term)));
 if(!items.length)return '<p>No hay coincidencias.</p>';
 return catalogue.sections.map((s:any)=>{const matches=items.filter((i:any)=>i.section===s.id);return matches.length?`<details class="music-category" ${term||section||missing?'open':''}><summary>${esc(s.title)} <span>${matches.length}</span></summary>${matches.map((item:any)=>itemMarkup(item,picker)).join('')}</details>`:'';}).join('');
}
function renderLibrary(){if(!catalogue)return;const query=($('library-search') as HTMLInputElement).value;const section=($('library-category') as HTMLSelectElement).value;const missing=($('library-missing') as HTMLInputElement).checked;$('library-results').innerHTML=groupedMarkup(query,section,missing,false);}
function renderPicker(){if(!catalogue||!canPublish)return;const query=($('picker-search') as HTMLInputElement).value;$('picker-results').innerHTML=groupedMarkup(query,'',false,true);}
function renderSelection(){
 $('music-selected-count').textContent=`${selected.length} seleccionados`;
 $('music-selected').innerHTML=selected.map((s,i)=>{const item=musicItem(s.id);return `<article class="selected-music"><div class="music-item-header"><h3>${i+1}. ${esc(item?.title||s.id)}</h3><div><button type="button" data-music-up="${i}" ${i===0?'disabled':''} aria-label="Subir ${esc(item?.title)}">↑ Subir</button><button type="button" data-music-down="${i}" ${i===selected.length-1?'disabled':''} aria-label="Bajar ${esc(item?.title)}">↓ Bajar</button><button type="button" data-music-remove="${esc(s.id)}">Quitar</button></div></div>${item?.parentTitle?`<small>${esc(item.parentTitle)} · audio del mix completo</small>`:''}<label>Para<select data-music-field="purpose" data-music-id="${esc(s.id)}">${Object.entries(purposes).map(([k,v])=>`<option value="${k}" ${s.purpose===k?'selected':''}>${v}</option>`).join('')}</select></label><label>Interpretación<select data-music-field="mode" data-music-id="${esc(s.id)}">${Object.entries(modes).map(([k,v])=>`<option value="${k}" ${s.mode===k?'selected':''}>${v}</option>`).join('')}</select></label><label>Indicaciones del director<textarea rows="2" maxlength="5000" data-music-field="notes" data-music-id="${esc(s.id)}" placeholder="Cortes, entradas, quién debe trabajar este tema…">${esc(s.notes)}</textarea></label></article>`;}).join('')||'<p>Selecciona mixes completos o canciones del catálogo.</p>';
}
export function musicSummary(rows:any[]){return rows?.length?`<div class="published-music"><h3>Plan musical · ${rows.length} seleccionados</h3>${rows.map((row:any,i:number)=>{const item=musicItem(row.id);return `<details><summary>${i+1}. ${esc(item?.title||row.id)} · ${esc(purposes[row.purpose]||'')}</summary><p>${esc(modes[row.mode]||'')}</p>${item?.key?`<p>Tonalidad: ${esc(item.key)}</p>`:''}${item?.tracks?.length?`<ol>${item.tracks.map((t:any)=>`<li>${esc(t.title)}${t.key?' · '+esc(t.key):''}</li>`).join('')}</ol>`:''}${row.notes?`<p class="entry-body">${esc(row.notes)}</p>`:''}${item?audioMarkup(item):''}</details>`;}).join('')}</div>`:'';}
export function setupLibrary(data:any,publish:boolean){
 catalogue=data;canPublish=publish;
 $('library-category').innerHTML='<option value="">Todas las secciones</option>'+data.sections.map((s:any)=>`<option value="${esc(s.id)}">${esc(s.title)}</option>`).join('');
 const missing=data.items.filter((i:any)=>!i.audio);$('library-count').textContent=`${data.items.length} entradas · ${data.items.filter((i:any)=>i.audio).length} con audio · ${missing.length} pendientes`;
 $('library-missing-list').textContent='Pendientes de audio: '+missing.map((i:any)=>i.title).join(', ')+'.';
 ['library-search','library-category','library-missing'].forEach(id=>$(id).addEventListener('input',renderLibrary));
 renderLibrary();
 if(publish){

  $('picker-search').addEventListener('input',renderPicker);
  $('repertoire-picker').addEventListener('click',event=>{
   const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-music-add]');if(!button)return;
   if(selected.length>=100){alert('Puedes seleccionar hasta 100 temas o mixes.');return;}
   const id=button.dataset.musicAdd!;if(selected.some(row=>row.id===id))return;
   const item=data.items.find((i:any)=>i.id===id)||data.items.find((i:any)=>i.tracks.some((t:any)=>t.id===id));
   const target=($('music-target') as HTMLSelectElement)?.selectedOptions[0]?.dataset.kind;
   selected.push({id,purpose:!$('music-director').hidden?(target==='ensayo'?'ensayo':'show'):($('kind') as HTMLSelectElement).value==='personal'?'personal':['evento','tenida'].includes(($('kind') as HTMLSelectElement).value)?'show':'ensayo',mode:item.mode,notes:''});
   renderSelection();renderPicker();
  });
  $('music-selected').addEventListener('click',event=>{const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;
   if(button.dataset.musicRemove)selected=selected.filter(s=>s.id!==button.dataset.musicRemove);
   if(button.dataset.musicUp!==undefined){const i=Number(button.dataset.musicUp);if(i>0)[selected[i-1],selected[i]]=[selected[i],selected[i-1]];}
   if(button.dataset.musicDown!==undefined){const i=Number(button.dataset.musicDown);if(i<selected.length-1)[selected[i+1],selected[i]]=[selected[i],selected[i+1]];}
   renderSelection();renderPicker();
  });
  $('music-selected').addEventListener('input',event=>{const input=event.target as HTMLInputElement;const row=selected.find(s=>s.id===input.dataset.musicId);if(row&&['purpose','mode','notes'].includes(input.dataset.musicField||''))(row as any)[input.dataset.musicField!]=input.value;});
  renderSelection();renderPicker();
 }
}
