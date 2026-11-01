import { outfitFor } from './outfits.js';
import { memberFor } from './members.js';
import outfitImages from './outfit-pdf-images.json' with { type: 'json' };
import PDFDocument from 'pdfkit';
import { findMusic, musicPurposes, validateMusic, downloadAudioUrl } from './catalog.js';
export async function rehearsalPdf(plan) {
 const rows=validateMusic(plan.music||[]);
 const isEvent=['evento','tenida'].includes(plan.kind);
 if(!rows.length&&!isEvent)throw new Error('Selecciona al menos un tema para generar el PDF.');
 const doc=new PDFDocument({size:'A4',margin:48,bufferPages:true,info:{Title:plan.title||'Plan musical Banda Bruna',Author:'Banda Bruna'}});
 const chunks=[];const finished=new Promise((resolve,reject)=>{doc.on('data',b=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 const text=(value,size=10,color='#334155')=>doc.font('Helvetica').fontSize(size).fillColor(color).text(String(value||''),{lineGap:3});
 const room=(height)=>{if(doc.y+height>doc.page.height-65)doc.addPage();};
 text(isEvent?'BANDA BRUNA / CONSOLIDADO PERSONAL DEL EVENTO':'BANDA BRUNA / DIRECCIÓN MUSICAL',10,'#947137');doc.moveDown(.6);
 doc.font('Helvetica-Bold').fontSize(23).fillColor('#0f172a').text(plan.title||'Plan musical');doc.moveDown(.5);
 if(plan.author)text(`Enviado por: ${plan.author}`);
 if(plan.starts_at)text(`${isEvent?'Fecha y tocata':'Fecha'}: ${new Intl.DateTimeFormat('es-CL',{dateStyle:'full',timeStyle:'short',timeZone:'America/Santiago'}).format(new Date(plan.starts_at))}`);
 if(plan.location)text(`Lugar: ${plan.location}`);
 text(`Destinatarios: ${plan.recipients?.length?plan.recipients.join(', '):'Toda la banda'}`);
 if(isEvent){
  text(`Preparado para: ${memberFor(plan.member_email)?.[1]||plan.member_email||'Integrante'}`);
  const info=plan.event_details||{};
  text(`Salida: ${info.departure_at?new Intl.DateTimeFormat('es-CL',{dateStyle:'full',timeStyle:'short',timeZone:'America/Santiago'}).format(new Date(info.departure_at)):'Por confirmar'}`);
  text(`Punto de encuentro: ${info.meeting_point||'Por confirmar'}`);
  text(`Valor personal a recibir: ${plan.payment_amount!=null?new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(plan.payment_amount):'Por confirmar'}`);
  const outfit=outfitFor(info.outfit_slug);
  if(outfit){
   doc.moveDown(.7);room(220);doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text(`Tenida: ${outfit.name}${outfit.suggested?' (combinación propuesta)':''}`);
   if(outfitImages[outfit.id]){const y=doc.y;doc.image(Buffer.from(outfitImages[outfit.id],'base64'),48,y,{fit:[360,200],align:'left'});doc.y=y+205;}
   text(outfit.description,10);doc.moveDown(.5);
  }else text(`Tenida: ${plan.outfit_text||'Por confirmar'}`);
  if(!plan.starts_at)text('Fecha y horario de tocata: por confirmar');
 }
 if(plan.body){doc.moveDown();text(plan.body);}
 const internal=plan.internal_work||plan.rehearsal?.internal_work;
 if(internal){doc.moveDown(.5);text('Trabajo interno y participantes',10,'#947137');text(internal);}
 if(isEvent){
  doc.moveDown();room(70);doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('Checklist del evento');
  (plan.checklist||[]).forEach((item,i)=>{room(25);text(`${plan.completed?.includes(i)?'[OK]':'[  ]'} ${String(item)}`);});
  if(!plan.checklist?.length)text('Sin recordatorios generales.');
  doc.moveDown(.5);room(70);doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('Mis responsabilidades');
  (plan.personal_checklist||[]).forEach(item=>{room(25);text(`${item.done?'[OK]':'[  ]'} ${String(item.text)}`);});
  if(!plan.personal_checklist?.length)text('Agrega tus pendientes personales desde la intranet.');
  doc.addPage();doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('Setlist y referencias de audio');
  if(!rows.length)text('Setlist por confirmar.');
 }
 doc.moveDown();
 rows.forEach((row,index)=>{
  const item=findMusic(row.id);room(110);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text(`${index+1}. ${item.title}`);
  text(`${musicPurposes[row.purpose]} | ${row.mode==='por-confirmar'?'Secuencia / bruto: por confirmar':row.mode==='secuencia'?'Con secuencia':row.mode==='bruto'?'En bruto':'Mixto'}`,9,'#947137');
  if(item.parentTitle)text(`Del mix: ${item.parentTitle}`);
  if(item.key)text(`Tonalidad / transición: ${item.key}`);
  item.tracks.forEach((track,i)=>{room(item.audio?48:30);text(`${i+1}. ${track.title}${track.key?' | '+track.key:''}`);if(item.audio){doc.fontSize(8).fillColor('#2563eb').text('Escuchar en el mix completo',{link:item.audio.url,underline:true,continued:true});doc.text('  /  Descargar mix MP3',{link:downloadAudioUrl(item.audio),underline:true});}});
  if(row.notes){doc.moveDown(.3);doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text('Indicaciones');text(row.notes);}
  if(item.note){room(35);text(item.note,9,'#64748b');}
  if(item.audio){room(35);doc.fontSize(9).fillColor('#2563eb').text(item.parentId?'Escuchar el mix completo (MP3)':'Escuchar MP3',{link:item.audio.url,underline:true});doc.text('Descargar MP3',{link:downloadAudioUrl(item.audio),underline:true});}
  else text('Audio pendiente de incorporar a la biblioteca.',9,'#9a3412');
  doc.moveDown(1.1);
 });
 const range=doc.bufferedPageRange();
 for(let i=range.start;i<range.start+range.count;i++){
  doc.switchToPage(i);const bottom=doc.page.margins.bottom;doc.page.margins.bottom=0;
  doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(`Banda Bruna · Uso interno · ${i+1} / ${range.count}`,48,doc.page.height-35,{lineBreak:false});doc.page.margins.bottom=bottom;
 }
 doc.end();return finished;
}
